import { NextRequest, NextResponse } from "next/server";
import {
  analyzeBrandWithLangChain,
  loadBrandDocuments,
  ingestDocumentsIntoSupabase,
  scrapeProductPage,
  saveScrapedProducts,
} from "@/lib/orchestration/brand-orchestrator";
import { db } from "@/lib/database";
import { validateSession } from "@/lib/auth/auth-utils";
import { ScrapedProduct } from "@/lib/types";
const CATALOG_PATHS = ["/collections/all", "/catalog", "/products", "/shop", "/collections", "/pages/shop"];

export async function POST(request: NextRequest) {
  // Server-side only: do not accept keys from client; support either env name
  const firecrawlApiKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY as string | undefined;
  if (!firecrawlApiKey) {
    return NextResponse.json({ error: "NEXT_PUBLIC_FIRECRAWL_API_KEY is not set" }, { status: 500 });
  }

  try {
    // Require authenticated user so we can link the brand analysis
    const auth = await validateSession(request);
    if (!auth.valid || !auth.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { url, original_url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'url'" }, { status: 400 });
    }

    const baseUrl = new URL(url);
    const normalizedUrl = `${baseUrl.protocol}//${baseUrl.host}/`;

    const canonicalHost = new URL(normalizedUrl).hostname;
    const result = await analyzeBrandWithLangChain(normalizedUrl, { firecrawlApiKey });
    if (!Array.isArray(result.sources)) {
      result.sources = [{ url: normalizedUrl, title: canonicalHost }];
    } else {
      result.sources = result.sources.filter((source: any) => {
        const sourceUrl = typeof source?.url === "string" ? source.url : null;
        return sourceUrl ? sourceUrl.includes(canonicalHost) : false;
      });
      if (!result.sources.length || !result.sources.some((source: any) => source?.url === normalizedUrl)) {
        result.sources.unshift({ url: normalizedUrl, title: canonicalHost });
      }
    }

    // Scrape associated products (if any) and store them
    let scrapedProducts: ScrapedProduct[] = [];
    try {
      scrapedProducts = await scrapeProductPage(normalizedUrl, { firecrawlApiKey });
      if (!scrapedProducts.length) {
        const normalizedBase = normalizedUrl.replace(/\/$/, "");
        for (const path of CATALOG_PATHS) {
          const candidate = `${normalizedBase}${path}`;
          const moreProducts = await scrapeProductPage(candidate, { firecrawlApiKey });
          for (const product of moreProducts) {
            const key = `${product.name}:${product.url ?? candidate}`;
            if (!scrapedProducts.some((p) => `${p.name}:${p.url ?? candidate}` === key)) {
              scrapedProducts.push(product);
            }
            if (scrapedProducts.length >= 12) break;
          }
          if (scrapedProducts.length >= 12) break;
        }
      }
      if (scrapedProducts.length) {
        await saveScrapedProducts(scrapedProducts, { url: normalizedUrl, userId: auth.user.id });
      }
    } catch (productError) {
      console.warn("Product scraping failed", productError);
    }

    // Persist to brand_analyses
    const client = db.getClient();
    await client.from('brand_analyses').insert({
      url: normalizedUrl,
      user_id: auth.user.id,
      voice: result.voice,
      palette: result.palette,
      fonts: result.fonts,
      icons: result.icons,
      sources: result.sources,
    });

    // Ingest brand voice into dedicated vector table with embeddings
    try {
      const docs = await loadBrandDocuments(normalizedUrl, { firecrawlApiKey });
      await ingestDocumentsIntoSupabase(docs, {
        url: normalizedUrl,
        user_id: auth.user.id,
        name: result?.sources?.[0]?.title,
        logos: result?.icons,
        voice: result.voice,
        palette: result.palette,
        fonts: result.fonts,
        source: 'brand_onboarding'
      } as any);
    } catch (e) {
      // Non-fatal: continue even if embeddings fail
      console.error('Embedding ingestion failed:', e);
    }

    return NextResponse.json({
      success: true,
      data: result,
      products: scrapedProducts,
      canonicalUrl: normalizedUrl,
      requestedUrl: original_url ?? url,
    });
  } catch (error) {
    console.error("Brand analysis failed", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


