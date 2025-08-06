import { NextResponse } from "next/server";
import { z } from "zod";
import { mockEmailFlows } from "@/lib/mock-data";

const emailFlowSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["welcome", "abandoned_cart", "post_purchase", "win_back", "custom"]),
  emails: z.array(z.object({
    delay: z.number(), // days
    subject: z.string(),
    template: z.string(),
  })),
});

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockEmailFlows,
      metadata: {
        total: mockEmailFlows.length,
        active: mockEmailFlows.filter(f => f.status === "active").length,
        totalRevenue: mockEmailFlows.reduce((sum, f) => sum + f.revenue, 0),
        totalSubscribers: mockEmailFlows.reduce((sum, f) => sum + f.subscribers, 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch email flows" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = emailFlowSchema.parse(body);

    const newFlow = {
      id: Date.now().toString(),
      ...validated,
      status: "draft",
      emails: validated.emails.length,
      avgOpenRate: 0,
      avgClickRate: 0,
      revenue: 0,
      subscribers: 0,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newFlow,
      message: "Email flow created successfully",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create email flow" },
      { status: 500 }
    );
  }
}