"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Globe,
  Palette,
  Type,
  Volume2,
  Sparkles,
  Plus,
  Share2,
  Target,
  Check,
  ArrowLeft,
  Calendar,
  Clock
} from "lucide-react";
import { useSession } from "next-auth/react";
import { isValidUrl } from "@/lib/utils";
import type { ScrapedProduct } from "@/lib/orchestration/brand-orchestrator";


export type OnboardingStep =
  | "brand_url"
  | "brand_summary"
  | "product_selection"
  | "platform_selection"
  | "content_preferences"
  | "schedule"
  | "review";

export interface OnboardingSnapshot {
  step: OnboardingStep;
  url?: string;
  analysis?: BrandAnalysisResult | null;
  productId?: string | null;
  platforms?: string[];
  contentPreferences?: string[];
  cadence?: string;
  days?: string[];
  sendTime?: string;
  timezone?: string;
  status?: "completed";
}

interface BrandOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (payload: OnboardingSnapshot & { status: "completed" }) => void;
  onProgress?: (step: OnboardingStep, snapshot: OnboardingSnapshot) => void;
  initialStep?: OnboardingStep;
  initialSnapshot?: OnboardingSnapshot | null;
  products?: Array<{
    id: string;
    category: string;
    name: string;
    image: string;
  }>;
}

type BrandAnalysisResult = {
  voice?: {
    tone?: string;
    styleGuidelines?: string[];
    taglines?: string[];
    keywords?: string[];
  };
  palette?: Array<{ hex: string; role?: string }>;
  fonts?: Array<{ family: string; weights?: string[] }>;
  icons?: Array<{ url: string; description?: string }>;
  sources?: Array<{ url: string; title?: string }>;
  canonicalUrl?: string;
  originalUrl?: string;
};

const DEFAULT_PRODUCTS = [
  {
    id: "premium-wireless-headphones",
    category: "Electronics",
    name: "Premium Wireless Headphones",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=720&q=80"
  },
  {
    id: "eco-friendly-water-bottle",
    category: "Lifestyle",
    name: "Eco-Friendly Water Bottle",
    image: "https://images.unsplash.com/photo-1523368280110-1625f02e36d5?auto=format&fit=crop&w=720&q=80"
  },
  {
    id: "minimalist-backpack",
    category: "Fashion",
    name: "Minimalist Backpack",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=720&q=80"
  },
  {
    id: "smart-fitness-watch",
    category: "Electronics",
    name: "Smart Fitness Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=720&q=80"
  }
];

const STEP_ORDER: OnboardingStep[] = [
  "brand_url",
  "brand_summary",
  "product_selection",
  "platform_selection",
  "content_preferences",
  "schedule",
  "review"
];

const PLATFORM_OPTIONS = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Feed, Reels, and Stories inspiration",
    icon: Palette
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Scripted hooks, trending sounds, and shots",
    icon: Volume2
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Paid and organic content angles",
    icon: Sparkles
  },
  {
    id: "email",
    name: "Email",
    description: "Flows, campaigns, and subject lines",
    icon: Type
  },
  {
    id: "marketplace",
    name: "Marketplace Listings",
    description: "Shopee, Tokopedia, and TikTok Shop copy",
    icon: Share2
  }
];

const CONTENT_OPTIONS = [
  {
    id: "launch_campaigns",
    name: "Product Launches",
    description: "New product drops, limited editions, or seasonal releases",
    icon: Target
  },
  {
    id: "education",
    name: "Education",
    description: "How-to guides, explainers, and tutorials",
    icon: Share2
  },
  {
    id: "ugc",
    name: "UGC & Social Proof",
    description: "Testimonials, haul content, and community love",
    icon: Volume2
  },
  {
    id: "promotions",
    name: "Promotions",
    description: "Flash sales, offers, bundles, and loyalty perks",
    icon: Sparkles
  },
  {
    id: "brand_story",
    name: "Brand Story",
    description: "Behind-the-scenes, founder story, and mission",
    icon: Palette
  },
  {
    id: "engagement",
    name: "Engagement Boost",
    description: "Interactive content, polls, and conversation starters",
    icon: Share2
  }
];

const CADENCE_OPTIONS = [
  {
    id: "2_per_week",
    label: "2 posts per week",
    description: "Great for getting started and staying consistent."
  },
  {
    id: "3_per_week",
    label: "3 posts per week",
    description: "Balanced cadence for most growing brands."
  },
  {
    id: "daily",
    label: "Daily",
    description: "Max visibility and rapid experimentation."
  }
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_DAYS = ["Monday", "Wednesday", "Friday"];
const DEFAULT_CADENCE = "3_per_week";
const DEFAULT_SEND_TIME = "09:00";

export default function BrandOnboardingModal({
  isOpen,
  onClose,
  onCompleted,
  onProgress,
  initialStep = "brand_url",
  initialSnapshot,
  products
}: BrandOnboardingModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BrandAnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [contentSelections, setContentSelections] = useState<string[]>([]);
  const [cadence, setCadence] = useState<string>(DEFAULT_CADENCE);
  const [selectedDays, setSelectedDays] = useState<string[]>(DEFAULT_DAYS);
  const [sendTime, setSendTime] = useState<string>(DEFAULT_SEND_TIME);
  const [timezone, setTimezone] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
  const [savedProducts, setSavedProducts] = useState<Array<{ id: string; name: string; category: string; image: string }>>([]);
  const availableProducts = useMemo(() => {
    if (savedProducts.length) return savedProducts;
    if (products?.length) return products as any;
    return [];
  }, [products, savedProducts]);
  const hydrationRef = useRef(false);
  const { data: session } = useSession();

  const resetState = useCallback(() => {
    setCurrentStep(initialStep);
    setResult(null);
    setSelectedProductId(null);
    setUrl("");
    setSelectedPlatforms([]);
    setContentSelections([]);
    setCadence(DEFAULT_CADENCE);
    setSelectedDays(DEFAULT_DAYS);
    setSendTime(DEFAULT_SEND_TIME);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
  }, [initialStep]);

  const loadState = useCallback((snapshot: OnboardingSnapshot) => {
    setUrl(snapshot.url ?? "");
    setResult(snapshot.analysis ?? null);
    setSelectedProductId(snapshot.productId ?? null);
    setSelectedPlatforms(snapshot.platforms ?? []);
    setContentSelections(snapshot.contentPreferences ?? []);
    setCadence(snapshot.cadence ?? DEFAULT_CADENCE);
    setSelectedDays(snapshot.days ?? DEFAULT_DAYS);
    setSendTime(snapshot.sendTime ?? DEFAULT_SEND_TIME);
    setTimezone(snapshot.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC");
    setCurrentStep(snapshot.status === "completed" ? "review" : snapshot.step ?? initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (!isOpen) {
      hydrationRef.current = false;
      resetState();
      return;
    }

    if (hydrationRef.current) return;

    if (initialSnapshot) {
      loadState(initialSnapshot);
    } else {
      setCurrentStep(initialStep);
    }

    hydrationRef.current = true;
  }, [isOpen, initialStep, initialSnapshot, loadState, resetState]);

  useEffect(() => {
    if (!isOpen || !session?.user?.id) return;
    const fetchProducts = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) return;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase
          .from("brand_products")
          .select("id, name, title, category, images")
          .eq("user_id", session?.user?.id ?? null)
          .order("created_at", { ascending: false })
          .limit(12);
        if (error) throw error;
        if (Array.isArray(data) && data.length) {
          const mapped = data.map((item) => {
            const parsedImages = Array.isArray(item.images)
              ? item.images
              : typeof item.images === "string"
              ? (() => {
                  try {
                    const maybe = JSON.parse(item.images);
                    return Array.isArray(maybe) ? maybe : [];
                  } catch {
                    return [];
                  }
                })()
              : [];

            return {
              id: item.id,
              name: item.title || item.name,
              category: item.category || "Product",
              image: parsedImages.length ? parsedImages[0] : DEFAULT_PRODUCTS[0].image,
            };
          });
          setSavedProducts(mapped);
        }
      } catch (err) {
        console.warn("Unable to load saved products", err);
        setSavedProducts([]);
      }
    };
    fetchProducts();
  }, [isOpen, session?.user?.id]);

  const getSnapshot = useCallback((): OnboardingSnapshot => ({
    step: currentStep,
    url,
    analysis: result,
    productId: selectedProductId,
    platforms: selectedPlatforms,
    contentPreferences: contentSelections,
    cadence,
    days: selectedDays,
    sendTime,
    timezone
  }), [currentStep, url, result, selectedProductId, selectedPlatforms, contentSelections, cadence, selectedDays, sendTime, timezone]);

  useEffect(() => {
    if (!isOpen) return;
    const current = getSnapshot();
    onProgress?.(current.step, current);
  }, [isOpen, getSnapshot, onProgress]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleContentPreference = (id: string) => {
    setContentSelections((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., https://yourbrand.com)");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Call Supabase Edge Function directly to avoid local env issues
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      headers["Authorization"] = `Bearer ${supabaseAnonKey}`;
      headers["apikey"] = supabaseAnonKey;
      // Optionally forward Firecrawl key from frontend env if present
      const firecrawlFromEnv = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;
      if (firecrawlFromEnv) {
        headers["x-firecrawl-key"] = firecrawlFromEnv;
      }
      const parsedUrl = new URL(url);
      const canonicalUrl = `${parsedUrl.protocol}//${parsedUrl.host}/`;

      const res = await fetch(`${supabaseUrl}/functions/v1/brand-analyze`, {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({ url: canonicalUrl, user_id: session?.user?.id, original_url: url }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const message = data?.error || data?.detail || data?.message || "Failed to analyze brand. Try again.";
        setError(typeof message === "string" ? message : JSON.stringify(message));
        setCurrentStep("brand_url");
      } else {
        setResult({
          ...data.data,
          canonicalUrl: data.canonicalUrl || canonicalUrl,
          originalUrl: url,
        });
        if (Array.isArray(data.products) && data.products.length) {
          setSavedProducts(
            data.products.map((p: any, idx: number) => ({
              id: p.id ?? `product-${idx}`,
              name: p.title || p.name,
              category: p.category || "Product",
              image: Array.isArray(p.images) && p.images.length ? p.images[0] : DEFAULT_PRODUCTS[0].image,
            }))
          );
        }
        setCurrentStep("brand_summary");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(message);
      setCurrentStep("brand_url");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleContinueFromSummary = () => {
    setCurrentStep("product_selection");
  };

  const handleProductContinue = () => {
    if (!selectedProductId) {
      setError("Please select a product to continue.");
      return;
    }
    setError("");
    setCurrentStep("platform_selection");
  };

  const handlePlatformContinue = () => {
    if (!selectedPlatforms.length) {
      setError("Select at least one platform to continue.");
      return;
    }
    setError("");
    setCurrentStep("content_preferences");
  };

  const handleContentContinue = () => {
    if (!contentSelections.length) {
      setError("Pick one or more content goals to continue.");
      return;
    }
    setError("");
    setCurrentStep("schedule");
  };

  const handleScheduleContinue = () => {
    if (!selectedDays.length) {
      setError("Choose at least one publishing day.");
      return;
    }
    setError("");
    setCurrentStep("review");
  };

  const handleFinish = () => {
    const finalSnapshot = { ...getSnapshot(), step: "review", status: "completed" as const };
    onCompleted?.(finalSnapshot);
    onClose();
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx <= 0) return;
    const prev = STEP_ORDER[idx - 1];
    if (prev === "brand_summary" && !result) {
      setCurrentStep("brand_url");
    } else {
      setCurrentStep(prev);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-lighter flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Brand Onboarding</h3>
              <p className="text-sm text-gray-500">Step {STEP_ORDER.indexOf(currentStep) + 1} of {STEP_ORDER.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {currentStep !== "brand_url" && (
          <button
            type="button"
            className="flex items-center gap-2 px-6 pt-4 text-sm text-gray-500 hover:text-primary"
            onClick={goBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {currentStep === "brand_url" && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="label block mb-2">Brand Website URL</label>
              <input
                type="url"
                placeholder="https://yourbrand.com"
                className="input w-full"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-2">We'll analyze your brand colors, fonts, style, and tone</p>
            </div>

            {/* No manual key entry; key is server-only for security */}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? "Analyzing..." : "Analyze My Brand"}
            </button>
          </form>
        )}

        {currentStep === "brand_summary" && result && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Brand Analysis Complete</h3>
              <p className="text-sm text-gray-600">
                We've analyzed{" "}
                <a
                  className="text-primary hover:underline"
                  href={(result?.canonicalUrl || result?.sources?.[0]?.url || url) || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  {(result?.canonicalUrl || result?.sources?.[0]?.url || url) || "your brand"}
                </a>
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-purple-100 p-2 text-purple-600">
                    <Palette className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold">Color Palette</h4>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {result?.palette?.length ? (
                    result.palette.slice(0, 6).map((color: any, idx: number) => (
                      <div key={`${color.hex}-${idx}`} className="flex flex-col items-center gap-2">
                        <span
                          className="h-16 w-16 rounded-2xl shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-medium text-gray-700">{color.hex}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No colors identified.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-cyan-100 p-2 text-cyan-600">
                    <Type className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold">Typography</h4>
                    <p className="text-xs text-gray-500">Primary fonts we detected</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {result?.fonts?.length ? (
                    result.fonts.slice(0, 4).map((font: any, idx: number) => (
                      <div key={`${font.family}-${idx}`} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="font-semibold text-gray-800">{font.family}</p>
                        {font.weights?.length ? (
                          <p className="text-xs text-gray-500">Weights: {font.weights.join(", ")}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No fonts detected.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-violet-100 p-2 text-violet-600">
                    <Volume2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold">Brand Voice</h4>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result?.voice?.tone || "We couldn't infer a clear brand tone."}
                </p>
                {result?.voice?.taglines?.length ? (
                  <div className="mt-4 text-sm">
                    <p className="font-medium text-gray-700">Signature Taglines</p>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      {result.voice.taglines.slice(0, 3).map((line: string, idx: number) => (
                        <li key={`${line}-${idx}`}>&ldquo;{line}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-amber-100 p-2 text-amber-600">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold">Visual Style</h4>
                    <p className="text-xs text-gray-500">Guidelines to stay on-brand</p>
                  </div>
                </div>
                {result?.voice?.styleGuidelines?.length ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {result.voice.styleGuidelines.slice(0, 6).map((guideline: string, idx: number) => (
                      <li key={`${guideline}-${idx}`} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No guidelines captured.</p>
                )}
              </section>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="btn-primary w-full py-3"
                onClick={handleContinueFromSummary}
              >
                Continue to Product Selection
              </button>
            </div>
          </div>
        )}

        {currentStep === "product_selection" && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Select Your Product</h3>
              <p className="text-sm text-gray-500">Choose a product page or add a new one</p>
            </div>

            {availableProducts.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[540px] overflow-y-auto pr-1">
                {availableProducts.map((product) => {
                  const selected = product.id === selectedProductId;
                  return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`group text-left rounded-3xl border bg-white shadow-sm transition-all ${
                      selected ? "border-primary ring-4 ring-primary/20" : "border-gray-100 hover:border-primary/40"
                    }`}
                  >
                    <div className="overflow-hidden rounded-t-3xl h-56 bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p>
                      <p className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</p>
                    </div>
                  </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                No products yet. We’ll add your products here after scraping your site.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button type="button" className="btn-primary w-full py-3" onClick={handleProductContinue} disabled={!selectedProductId}>
              Continue to Platform Selection
            </button>
          </div>
        )}

        {currentStep === "platform_selection" && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Where do you want content?</h3>
              <p className="text-sm text-gray-500">Pick all platforms you sell or market on</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = selectedPlatforms.includes(platform.id);
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-start gap-4 rounded-3xl border bg-white p-5 text-left shadow-sm transition-all ${
                      selected ? "border-primary ring-4 ring-primary/20" : "border-gray-100 hover:border-primary/40"
                    }`}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        {platform.name}
                        {selected && <Check className="h-4 w-4 text-primary" />}
                      </p>
                      <p className="text-sm text-gray-500">{platform.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button type="button" className="btn-primary w-full py-3" onClick={handlePlatformContinue}>
              Continue to Content Preferences
            </button>
          </div>
        )}

        {currentStep === "content_preferences" && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">What should we focus on?</h3>
              <p className="text-sm text-gray-500">Select the content themes that best match your goals</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CONTENT_OPTIONS.map((option) => {
                const selected = contentSelections.includes(option.id);
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleContentPreference(option.id)}
                    className={`flex items-start gap-4 rounded-3xl border bg-white p-5 text-left shadow-sm transition-all ${
                      selected ? "border-primary ring-4 ring-primary/20" : "border-gray-100 hover:border-primary/40"
                    }`}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        {option.name}
                        {selected && <Check className="h-4 w-4 text-primary" />}
                      </p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button type="button" className="btn-primary w-full py-3" onClick={handleContentContinue}>
              Continue to Schedule
            </button>
          </div>
        )}

        {currentStep === "schedule" && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">How often should we publish?</h3>
              <p className="text-sm text-gray-500">Set your preferred cadence and timing</p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Cadence
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CADENCE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCadence(option.id)}
                      className={`rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all ${
                        cadence === option.id ? "border-primary ring-4 ring-primary/20" : "border-gray-100 hover:border-primary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Preferred days
                </p>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const selected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          selected ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-600 hover:border-primary/40"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Preferred send time
                  </label>
                  <input
                    type="time"
                    value={sendTime}
                    onChange={(e) => setSendTime(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button type="button" className="btn-primary w-full py-3" onClick={handleScheduleContinue}>
              Continue to Review
            </button>
          </div>
        )}

        {currentStep === "review" && (
          <div className="p-6 space-y-6 bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Review Your Setup</h3>
              <p className="text-sm text-gray-500">Confirm everything looks good before we start creating content</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Brand URL</p>
                <a href={url} target="_blank" rel="noreferrer" className="text-primary text-sm break-all hover:underline">
                  {url}
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Product</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {availableProducts.find((p) => p.id === selectedProductId)?.name ?? "Not selected"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Platforms</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedPlatforms.map((id) => PLATFORM_OPTIONS.find((p) => p.id === id)?.name).filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Content goals</p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                  {contentSelections.map((id) => {
                    const label = CONTENT_OPTIONS.find((opt) => opt.id === id)?.name ?? id;
                    return (
                      <span key={id} className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Schedule</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Cadence:</span> {CADENCE_OPTIONS.find((opt) => opt.id === cadence)?.label}</p>
                  <p><span className="font-medium">Days:</span> {selectedDays.join(", ")}</p>
                  <p><span className="font-medium">Time:</span> {sendTime} ({timezone})</p>
                </div>
              </div>
            </div>

            <button type="button" className="btn-primary w-full py-3" onClick={handleFinish}>
              Finish Onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


