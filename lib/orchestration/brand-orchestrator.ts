import { z } from "zod";
// Note: LangChain libs are dynamically imported to avoid build-time type issues

export const brandAnalysisSchema = z.object({
  voice: z.object({
    tone: z.string().describe("Short description of brand tone"),
    styleGuidelines: z.array(z.string()).describe("Guidelines for copywriting style"),
    taglines: z.array(z.string()).describe("Representative taglines or slogans"),
    keywords: z.array(z.string()).describe("Keywords and phrases the brand repeats"),
  }),
  palette: z.array(z.object({ hex: z.string(), role: z.string().optional() })).describe("Primary colors as hex codes"),
  fonts: z.array(z.object({ family: z.string(), weights: z.array(z.string()).optional() })),
  icons: z.array(z.object({ url: z.string().url(), description: z.string().optional() })),
  sources: z.array(z.object({ url: z.string().url(), title: z.string().optional() })).default([]),
});

export type BrandAnalysis = z.infer<typeof brandAnalysisSchema>;

type BrandPageDocument = { url: string; title?: string; content: string };

const BRAND_PAGE_PATH_CANDIDATES = [
  "/about",
  "/about-us",
  "/pages/about",
  "/pages/about-us",
  "/our-story",
  "/pages/our-story",
  "/mission",
  "/values",
  "/brand-story",
  "/pages/brand-story",
  "/philosophy",
  "/pages/philosophy",
  "/blog",
  "/blogs",
  "/pages/blog",
];

const MAX_BRAND_PAGES = 6;
const MAX_BRAND_PAGE_ATTEMPTS = 14;

function buildBrandPageCandidates(inputUrl: string): string[] {
  const base = new URL(inputUrl);
  const origin = `${base.protocol}//${base.host}`;
  const paths: string[] = [];
  if (base.pathname && base.pathname !== "/") {
    paths.push(base.pathname);
  }
  paths.push("/");
  for (const candidate of BRAND_PAGE_PATH_CANDIDATES) {
    if (!paths.includes(candidate)) {
      paths.push(candidate);
    }
  }
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const path of paths) {
    if (candidates.length >= MAX_BRAND_PAGE_ATTEMPTS) break;
    try {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const candidateUrl = new URL(normalizedPath, origin).toString();
      if (!seen.has(candidateUrl)) {
        seen.add(candidateUrl);
        candidates.push(candidateUrl);
      }
    } catch {
      // ignore invalid paths
    }
  }
  return candidates;
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function firecrawlScrapeContent(url: string, apiKey: string) {
  const res = await fetch("https://api.firecrawl.dev/v0/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      structuredMetadata: true,
      formats: ["markdown", "html"],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl scrape failed: ${text}`);
  }
  const json = await res.json();
  const pages = Array.isArray(json?.pages) ? json.pages : [json];
  const docs: BrandPageDocument[] = [];
  for (const page of pages) {
    const markdown = typeof page?.markdown === "string" ? page.markdown : "";
    const contentField = typeof page?.content === "string" ? page.content : "";
    const html = typeof page?.html === "string" ? page.html : "";
    const rawContent = markdown.trim() || contentField.trim() || stripHtmlTags(html);
    if (!rawContent) continue;
    let resolvedUrl = page?.url || page?.metadata?.url || url;
    try {
      resolvedUrl = new URL(resolvedUrl, url).toString();
    } catch {
      resolvedUrl = url;
    }
    const normalizedUrl = resolvedUrl.split("#")[0];
    docs.push({
      url: normalizedUrl,
      title: page?.metadata?.title || page?.title || undefined,
      content: rawContent,
    });
  }
  return docs;
}

async function gatherBrandPageDocuments(url: string, apiKey: string): Promise<BrandPageDocument[]> {
  const candidates = buildBrandPageCandidates(url);
  const documents: BrandPageDocument[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (documents.length >= MAX_BRAND_PAGES) break;
    try {
      const docs = await firecrawlScrapeContent(candidate, apiKey);
      for (const doc of docs) {
        if (!doc?.content) continue;
        if (seen.has(doc.url)) continue;
        seen.add(doc.url);
        documents.push(doc);
        if (documents.length >= MAX_BRAND_PAGES) break;
      }
    } catch (error) {
      console.warn("Brand page scrape failed", candidate, error);
    }
  }
  return documents;
}

export async function analyzeBrandWithLangChain(url: string, opts?: { firecrawlApiKey?: string }): Promise<BrandAnalysis> {
  const firecrawlKey = opts?.firecrawlApiKey || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;
  if (!firecrawlKey) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }

  const brandDocs = await gatherBrandPageDocuments(url, firecrawlKey);

  let combined = "";
  let sources: Array<{ url: string; title?: string }> = [];

  if (brandDocs.length) {
    combined = brandDocs
      .map((doc) => `Source: ${doc.title ?? doc.url}\n\n${doc.content}`)
      .join("\n\n---\n\n");
    sources = brandDocs.map((doc) => ({ url: doc.url, title: doc.title }));
  } else {
    const { FireCrawlLoader } = await import("@langchain/community/document_loaders/web/firecrawl");
    const loader: any = new FireCrawlLoader({
      url,
      apiKey: firecrawlKey,
      mode: "scrape",
      params: { formats: ["markdown", "html"], onlyMainContent: true },
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
        },
      },
    } as any);
    const fallbackDocs: any[] = await loader.load();
    combined = fallbackDocs.map((d: any) => d.pageContent).join("\n\n---\n\n");
    sources = fallbackDocs
      .map((d: any) => ({
        url: d?.metadata?.url || d?.metadata?.source || d?.metadata?.loc || url,
        title: d?.metadata?.title,
      }))
      .filter((s) => typeof s.url === "string");
  }

  const content = (combined || "").slice(0, 150_000);

  // 2) Build model + structured parser
  const { ChatOpenAI } = await import("@langchain/openai");
  const { StructuredOutputParser, JsonOutputParser } = await import("@langchain/core/output_parsers");
  const { ChatPromptTemplate } = await import("@langchain/core/prompts");

  const model: any = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.2 });
  const parser: any = StructuredOutputParser.fromZodSchema(brandAnalysisSchema);

  const prompt: any = ChatPromptTemplate.fromTemplate(
    `You are a senior brand analyst. From the provided website content, extract a precise, factual, and concise summary of the brand assets.

Return ONLY the JSON that matches this schema: {schema}

CONTENT:\n{content}`
  );

  const chain: any = prompt.pipe(model).pipe(new JsonOutputParser());

  const raw = await chain.invoke({
    content,
    schema: parser.getFormatInstructions(),
  } as any);

  const parsed: BrandAnalysis = brandAnalysisSchema.parse(raw);
  // Ensure the requested URL is included as a source
  if (!Array.isArray(parsed.sources)) parsed.sources = [] as any;
  if (!parsed.sources.some(s => s.url === url)) parsed.sources.push({ url });
  return parsed;
}

export async function loadBrandDocuments(url: string, opts?: { firecrawlApiKey?: string }): Promise<any[]> {
  const firecrawlKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;
  if (!firecrawlKey) {
    throw new Error("NEXT_PUBLIC_FIRECRAWL_API_KEY is not set");
  }
  const { FireCrawlLoader } = await import("@langchain/community/document_loaders/web/firecrawl");
  const loader: any = new FireCrawlLoader({
    url,
    apiKey: firecrawlKey,
    mode: "scrape",
    params: { formats: ["markdown", "html"], onlyMainContent: true },
    fetchOptions: {
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
      }
    }
  } as any);
  const docs: any[] = await loader.load();
  return docs;
}

export async function ingestDocumentsIntoSupabase(docs: any[], metadata: Record<string, any> & { url: string, user_id?: string, name?: string, logos?: any }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set (required for embeddings)");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(supabaseUrl, service);

  const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");
  const splitter: any = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 120 });
  const chunks: any[] = [];
  for (const d of docs) {
    const split: any[] = await splitter.splitDocuments([
      { pageContent: d.pageContent, metadata: { ...(d.metadata || {}), ...metadata } },
    ] as any);
    chunks.push(...split);
  }

  const { OpenAIEmbeddings } = await import("@langchain/openai");
  const { SupabaseVectorStore } = await import("@langchain/community/vectorstores/supabase");
  const embeddings: any = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
  // Create a temporary vector store targeting the new brand_voice table by
  // providing custom upsert logic: SupabaseVectorStore doesn't natively handle
  // arbitrary schemas, so we insert manually after computing embeddings.
  const vectors: { content: string; embedding: number[]; meta: any }[] = [];
  for (const c of chunks) {
    const vec = await embeddings.embedQuery(c.pageContent);
    vectors.push({ content: c.pageContent, embedding: vec, meta: c.metadata });
  }

  const rows = vectors.map(v => ({
    user_id: metadata.user_id ?? null,
    url: metadata.url,
    name: metadata.name ?? null,
    voice: { tone: metadata?.voice?.tone, styleGuidelines: metadata?.voice?.styleGuidelines, taglines: metadata?.voice?.taglines, keywords: metadata?.voice?.keywords },
    palette: metadata?.palette ?? null,
    fonts: metadata?.fonts ?? null,
    logos: metadata?.logos ?? null,
    metadata: { ...v.meta, source: 'brand_onboarding' },
    embedding: v.embedding as unknown as any
  }));

  // Batch insert
  const { error } = await client.from('brand_voice').insert(rows as any);
  if (error) throw error;

  return { inserted: chunks.length };
}

const PRODUCT_KEYWORDS = [/products\//i, /product\//i, /item\//i, /catalog\//i, /shop\//i, /collections\//i];
const MAX_PRODUCT_RESULTS = 12;
const MAX_DISCOVERED_LINKS = 30;

function extractCandidatesFromMetadata(meta: any): any[] {
  if (!meta) return [];
  const candidates: any[] = [];
  const graph = Array.isArray(meta?."@graph") ? meta["@graph"] : undefined;
  if (graph) candidates.push(...graph);
  if (Array.isArray(meta?.products)) candidates.push(...meta.products);
  if (Array.isArray(meta?.offers)) candidates.push(...meta.offers);
  if (Array.isArray(meta?.product)) candidates.push(...meta.product);
  if (typeof meta === "object") candidates.push(meta);
  return candidates;
}

export async function scrapeProductPage(baseUrl: string, opts?: { firecrawlApiKey?: string }) {
  const key = opts?.firecrawlApiKey || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set");

  const scrape = async (url: string) => {
    const res = await fetch("https://api.firecrawl.dev/v0/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url,
        structuredMetadata: true,
        formats: ["html", "markdown"],
        onlyMainContent: false,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firecrawl scrape failed: ${text}`);
    }
    return res.json();
  };

  const normalizedBase = baseUrl.replace(/\/$/, "");
  const baseHost = (() => {
    try {
      return new URL(normalizedBase).hostname;
    } catch {
      return undefined;
    }
  })();
  const productMap = new Map<string, ScrapedProduct>();
  const visited = new Set<string>();
  const queue: string[] = [normalizedBase, `${normalizedBase}/collections/all`, `${normalizedBase}/products`, `${normalizedBase}/collections`];

  while (queue.length && productMap.size < MAX_PRODUCT_RESULTS) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const data = await scrape(url);
      const pages = Array.isArray(data?.pages) ? data.pages : [data];
      for (const page of pages) {
        const meta = page?.metadata || page?.structuredMetadata;
        const candidates = extractCandidatesFromMetadata(meta);
        for (const candidate of candidates) {
          const product = normalizeProductMetadata({
            metadata: candidate,
            url: candidate?.url || meta?.url || page?.url || url,
            html: page?.html,
            markdown: page?.markdown,
            baseHost,
          });
          if (product) {
            const keyId = `${product.name}:${product.url ?? url}`;
            if (!productMap.has(keyId)) {
              productMap.set(keyId, product);
            }
          }
          if (productMap.size >= MAX_PRODUCT_RESULTS) break;
        }
        if (productMap.size >= MAX_PRODUCT_RESULTS) break;

        const links = collectLinks(page?.html, url);
        for (const link of links) {
          if (!visited.has(link)) queue.push(link);
        }
      }
    } catch (error) {
      console.warn("Unable to scrape", url, error);
    }
  }

  return Array.from(productMap.values()).slice(0, MAX_PRODUCT_RESULTS);
}

export function normalizeProductMetadata(input: { metadata?: any; url?: string; html?: string; markdown?: string; baseHost?: string }) {
  const meta = input.metadata || {};
  const rawType = meta["@type"];
  const isProductType =
    typeof rawType === "string"
      ? rawType.toLowerCase().includes("product")
      : Array.isArray(rawType)
      ? rawType.some((t: any) => typeof t === "string" && t.toLowerCase().includes("product"))
      : false;

  const inferredUrl = extractFirstString(meta.url ?? input.url);
  const looksLikeProductUrl = typeof inferredUrl === "string" && PRODUCT_KEYWORDS.some((re) => re.test(inferredUrl));
  const rawPrice = meta.price ?? meta.offers?.price ?? meta.offers?.[0]?.price ?? meta.priceRange;
  const hasPriceInfo =
    typeof rawPrice === "number" ||
    (typeof rawPrice === "string" && /\d/.test(rawPrice)) ||
    Array.isArray(meta.offers) ||
    !!meta.offers?.price;
  const hasSku = Boolean(meta.sku || meta.productId || meta.identifier || meta.mpn);

  if (!isProductType && !looksLikeProductUrl) {
    return null;
  }

  const name = (meta.name || meta.title || meta.headline || "").trim();
  if (!name) return null;

  const normalizedName = name.replace(/\s+/g, " ").trim();
  const brandName = typeof meta.brand === "string"
    ? meta.brand
    : typeof meta.brand?.name === "string"
    ? meta.brand.name
    : undefined;

  const NON_PRODUCT_NAME_PATTERNS = [/^skintific$/i, /^shopify$/i, /^shopify[\s-]?inc$/i, /^shop$/i, /^home$/i];
  if (NON_PRODUCT_NAME_PATTERNS.some((re) => re.test(normalizedName))) {
    return null;
  }

  if (brandName && normalizedName.toLowerCase() === brandName.toLowerCase()) {
    return null;
  }

  if (input.baseHost && inferredUrl) {
    try {
      const productHost = new URL(inferredUrl).hostname;
      if (productHost && productHost !== input.baseHost && !productHost.endsWith(`.${input.baseHost}`)) {
        return null;
      }
    } catch {
      // ignore parsing errors
    }
  }

  if (!looksLikeProductUrl && !(hasPriceInfo || hasSku)) {
    return null;
  }

  if (inferredUrl) {
    try {
      const urlObj = new URL(inferredUrl);
      if (urlObj.pathname === "/" || urlObj.pathname === "") {
        return null;
      }
      if (/^\/?(home|shop|store|products)$/i.test(urlObj.pathname.replace(/^\//, ""))) {
        return null;
      }
    } catch {
      // ignore invalid URL
    }
  } else {
    return null;
  }

  const images = extractImages(meta, input.html, input.markdown);
  const priceValue =
    typeof rawPrice === "string"
      ? parseFloat(rawPrice.replace(/[^0-9.,]/g, "").replace(/,/g, ""))
      : typeof rawPrice === "number"
      ? rawPrice
      : undefined;

  const product = productSchema.safeParse({
    id: meta.productId || meta.sku || undefined,
    name,
    title: meta.headline || meta.title || name,
    description: meta.description || meta.productDescription || meta.summary,
    price: !Number.isNaN(priceValue || NaN) ? priceValue : undefined,
    priceText: meta.price || meta.priceCurrency ? `${meta.priceCurrency ?? ""} ${meta.price ?? ""}`.trim() : undefined,
    currency: meta.priceCurrency || meta.offers?.priceCurrency,
    category: meta.category || meta.productCategory,
    sku: meta.sku,
    url: inferredUrl,
    images,
    attributes: meta,
  });
  if (!product.success) {
    console.warn("Product normalization failed", product.error?.errors, { name, inferredUrl });
    return null;
  }
  return product.data;
}

function extractImages(meta: any, html?: string, markdown?: string) {
  const images = new Set<string>();
  const metaImages = meta.images || meta.image || meta.thumbnailUrl || meta.thumbnail || [];
  const add = (value: any) => {
    if (!value) return;
    if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === "string" && value.startsWith("http")) images.add(value);
    else if (typeof value === "object") add(value.url || value.src);
  };
  add(metaImages);
  const regex = /https?:[^"'\s)]+\.(?:png|jpg|jpeg|gif|webp)/gi;
  const fromHtml = html?.match(regex) || [];
  const fromMarkdown = markdown?.match(regex) || [];
  [...fromHtml, ...fromMarkdown].forEach(add);
  return Array.from(images);
}

export async function saveScrapedProducts(products: ScrapedProduct[], options: { url: string; userId?: string }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !service) {
    throw new Error("Supabase credentials missing");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(supabaseUrl, service);
  const formatted = products.map((product) => ({
    name: product.name,
    title: product.title ?? product.name,
    description: product.description,
    price: product.price ?? null,
    price_text: product.priceText ?? null,
    currency: product.currency ?? null,
    category: product.category ?? null,
    sku: product.sku ?? null,
    url: product.url ?? options.url,
    images: product.images ?? [],
    attributes: product.attributes ?? {},
    user_id: options.userId ?? null,
    source_url: options.url,
  }));
  const { data, error } = await client.from("brand_products").insert(formatted).select();
  if (error) throw error;
  return data;
}


