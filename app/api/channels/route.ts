import { NextResponse } from "next/server";
import { z } from "zod";

const channelSchema = z.object({
  type: z.enum(["shopee", "tokopedia", "tiktok", "lazada", "bukalapak", "blibli"]),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  shopId: z.string().optional(),
});

// Mock channel data
const mockChannels = [
  {
    id: "1",
    type: "shopee",
    name: "Shopee Store",
    connected: true,
    lastSync: new Date(Date.now() - 3600000),
    metrics: {
      products: 45,
      orders: 1250,
      revenue: 125000000,
    },
  },
  {
    id: "2",
    type: "tokopedia",
    name: "Tokopedia Store",
    connected: true,
    lastSync: new Date(Date.now() - 7200000),
    metrics: {
      products: 42,
      orders: 980,
      revenue: 98000000,
    },
  },
  {
    id: "3",
    type: "tiktok",
    name: "TikTok Shop",
    connected: false,
    lastSync: null,
    metrics: null,
  },
  {
    id: "4",
    type: "lazada",
    name: "Lazada Store",
    connected: false,
    lastSync: null,
    metrics: null,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockChannels,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = channelSchema.parse(body);

    // Simulate channel connection
    const newChannel = {
      id: Date.now().toString(),
      ...validated,
      name: `${validated.type.charAt(0).toUpperCase() + validated.type.slice(1)} Store`,
      connected: true,
      lastSync: new Date(),
      metrics: {
        products: 0,
        orders: 0,
        revenue: 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: newChannel,
      message: "Channel connected successfully. Initial sync in progress...",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to connect channel" },
      { status: 500 }
    );
  }
}