import { NextResponse } from "next/server";
import { z } from "zod";
import { mockCampaigns } from "@/lib/mock-data";

const campaignSchema = z.object({
  name: z.string().min(1),
  channels: z.array(z.string()).min(1),
  budget: z.number().positive(),
  objective: z.enum(["conversions", "traffic", "awareness", "engagement"]),
  autoOptimize: z.boolean().optional(),
});

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockCampaigns,
      metadata: {
        total: mockCampaigns.length,
        active: mockCampaigns.filter(c => c.status === "active").length,
        totalSpend: mockCampaigns.reduce((sum, c) => sum + c.spent, 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = campaignSchema.parse(body);

    // Simulate AI prediction
    const predictedROAS = 3.5 + Math.random() * 2;
    const estimatedReach = validated.budget * 50;

    const newCampaign = {
      id: Date.now().toString(),
      ...validated,
      status: "active",
      spent: 0,
      roas: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      experiments: 0,
      autoOptimize: validated.autoOptimize ?? true,
      createdAt: new Date(),
      predictions: {
        roas: predictedROAS,
        reach: estimatedReach,
        confidenceScore: 0.75,
      },
    };

    return NextResponse.json({
      success: true,
      data: newCampaign,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}