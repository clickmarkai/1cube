import { NextResponse } from "next/server";
import { z } from "zod";
import { ai } from "@/lib/ai";

const competitorAnalysisSchema = z.object({
  handle: z.string().min(1),
  platform: z.enum(["instagram", "tiktok", "facebook", "shopee", "tokopedia"]),
  adContent: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = competitorAnalysisSchema.parse(body);

    // Analyze competitor using AI
    const analysis = await ai.analyzeCompetitor({
      handle: validated.handle,
      platform: validated.platform,
      adContent: validated.adContent,
    });

    // Generate mock metrics (in production, these would come from real data)
    const metrics = {
      engagement: 3.5 + Math.random() * 3,
      reach: Math.floor(50000 + Math.random() * 200000),
      sentiment: 70 + Math.floor(Math.random() * 20),
    };

    return NextResponse.json({
      success: true,
      data: {
        handle: validated.handle,
        platform: validated.platform,
        analysis,
        metrics,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze competitor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return trending insights
    const trendingInsights = [
      {
        id: "1",
        type: "angle",
        title: "Morning Routine Content Surging",
        description: "Morning wellness routine content seeing 3x engagement on TikTok Shop",
        impact: "high",
        actionable: "Create morning routine bundle with video content",
        source: "TikTok Analytics",
      },
      {
        id: "2",
        type: "product",
        title: "Collagen + Vitamin C Combos Trending",
        description: "Bundle sales up 45% when collagen paired with Vitamin C",
        impact: "high",
        actionable: "Launch collagen + vitamin C bundle campaign",
        source: "Marketplace Data",
      },
      {
        id: "3",
        type: "competitor",
        title: "New Competitor: WellnessKu",
        description: "Fast-growing brand captured 8% market share in 3 months",
        impact: "medium",
        actionable: "Analyze their influencer strategy and pricing",
        source: "Market Research",
      },
    ];

    return NextResponse.json({
      success: true,
      data: trendingInsights,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}