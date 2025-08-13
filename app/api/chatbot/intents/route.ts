import { NextResponse } from "next/server";
import { z } from "zod";
import { mockChatbotIntents } from "@/lib/mock-data";

const intentSchema = z.object({
  intent: z.string().min(1),
  examples: z.array(z.string()).min(1),
  response: z.string().min(1),
});

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockChatbotIntents,
      metadata: {
        total: mockChatbotIntents.length,
        totalUsage: mockChatbotIntents.reduce((sum, i) => sum + i.usage, 0),
        intents: [...new Set(mockChatbotIntents.map(i => i.intent))],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch intents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = intentSchema.parse(body);

    const newIntent = {
      id: Date.now().toString(),
      ...validated,
      usage: 0,
      accuracy: 90,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newIntent,
      message: "Intent created successfully",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create intent" },
      { status: 500 }
    );
  }
}