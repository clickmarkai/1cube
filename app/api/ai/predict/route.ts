import { NextResponse } from "next/server";
import { z } from "zod";
import { ai } from "@/lib/ai";

const predictionSchema = z.object({
  type: z.enum(["campaign", "ad", "product", "bundle"]),
  data: z.object({
    name: z.string(),
    channels: z.array(z.string()).optional(),
    budget: z.number().optional(),
    targetAudience: z.string().optional(),
    creatives: z.array(z.string()).optional(),
    products: z.array(z.string()).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = predictionSchema.parse(body);

    let prediction;

    switch (validated.type) {
      case "campaign":
        // Predict campaign performance
        prediction = await ai.predictCampaignPerformance({
          name: validated.data.name,
          channels: validated.data.channels || [],
          budget: validated.data.budget || 0,
          targetAudience: validated.data.targetAudience || "",
          creatives: validated.data.creatives || [],
        });
        break;

      case "ad":
        // Detect if ad is dying/dead
        const mockMetrics = {
          impressions: 100000,
          clicks: 500,
          conversions: 10,
          spend: 500000,
          ctr: 0.5,
          cpa: 50000,
          daysSinceStart: 14,
        };
        
        const deadAdDetection = await ai.detectDeadAd(mockMetrics);
        prediction = {
          ...deadAdDetection,
          recommendations: deadAdDetection.isDead 
            ? ["Pause immediately", "Test new creative angles", "Review targeting"]
            : ["Continue monitoring", "Consider scaling budget"],
        };
        break;

      case "product":
        // Predict product performance
        prediction = {
          projectedSales: Math.floor(100 + Math.random() * 400),
          projectedRevenue: Math.floor(10000000 + Math.random() * 50000000),
          marketDemand: 70 + Math.floor(Math.random() * 20),
          competitionLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
          recommendations: [
            "Focus on morning routine positioning",
            "Bundle with complementary products",
            "Target health-conscious millennials",
          ],
        };
        break;

      case "bundle":
        // Predict bundle performance
        prediction = {
          projectedAOV: 450000 + Math.floor(Math.random() * 200000),
          marginImprovement: 5 + Math.floor(Math.random() * 10),
          crossSellProbability: 60 + Math.floor(Math.random() * 30),
          customerSatisfaction: 80 + Math.floor(Math.random() * 15),
          recommendations: [
            "Highlight synergy between products",
            "Create usage guide content",
            "Offer time-limited discount",
          ],
        };
        break;

      default:
        throw new Error("Invalid prediction type");
    }

    return NextResponse.json({
      success: true,
      data: {
        type: validated.type,
        prediction,
        confidence: 0.7 + Math.random() * 0.25,
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

    console.error("Prediction error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}