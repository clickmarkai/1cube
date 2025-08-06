import { NextResponse } from "next/server";
import { z } from "zod";
import { mockOrders } from "@/lib/mock-data";

const orderStatusUpdateSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const dateRange = searchParams.get("dateRange");
    
    let filteredOrders = [...mockOrders];
    
    // Filter by status
    if (status && status !== "all") {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // Filter by channel
    if (channel) {
      filteredOrders = filteredOrders.filter(order => order.channel === channel);
    }
    
    // Filter by date range
    if (dateRange) {
      const now = new Date();
      const ranges: Record<string, number> = {
        "today": 0,
        "yesterday": 1,
        "last7days": 7,
        "last30days": 30,
      };
      
      if (ranges[dateRange] !== undefined) {
        const daysAgo = ranges[dateRange];
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);
        startDate.setHours(0, 0, 0, 0);
        
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.date) >= startDate
        );
      }
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: filteredOrders,
      metadata: {
        total: filteredOrders.length,
        totalRevenue: filteredOrders
          .filter(o => o.status !== "cancelled")
          .reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: filteredOrders.length > 0
          ? filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length
          : 0,
        statusBreakdown: {
          pending: filteredOrders.filter(o => o.status === "pending").length,
          processing: filteredOrders.filter(o => o.status === "processing").length,
          shipped: filteredOrders.filter(o => o.status === "shipped").length,
          delivered: filteredOrders.filter(o => o.status === "delivered").length,
          cancelled: filteredOrders.filter(o => o.status === "cancelled").length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validated = orderStatusUpdateSchema.parse(body);

    // In production, this would update the database
    // For now, return success with the updated data
    return NextResponse.json({
      success: true,
      data: {
        orderId: validated.orderId,
        status: validated.status,
        trackingNumber: validated.trackingNumber,
        updatedAt: new Date(),
      },
      message: `Order ${validated.orderId} updated to ${validated.status}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}