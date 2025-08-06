import { NextResponse } from "next/server";
import { z } from "zod";
import { mockInventory } from "@/lib/mock-data";

const inventoryUpdateSchema = z.object({
  productId: z.string(),
  channelType: z.string(),
  quantity: z.number().int().min(0),
  action: z.enum(["set", "add", "subtract"]),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    let filteredInventory = mockInventory;
    
    if (status && status !== "all") {
      filteredInventory = mockInventory.filter(item => {
        const totalStock = Object.values(item.channels).reduce((sum, qty) => sum + qty, 0);
        
        switch (status) {
          case "critical":
            return totalStock <= item.reorderPoint * 0.5;
          case "low":
            return totalStock <= item.reorderPoint && totalStock > item.reorderPoint * 0.5;
          case "healthy":
            return totalStock > item.reorderPoint && totalStock < item.reorderPoint * 5;
          case "overstocked":
            return totalStock >= item.reorderPoint * 5;
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredInventory,
      metadata: {
        total: filteredInventory.length,
        critical: mockInventory.filter(i => {
          const total = Object.values(i.channels).reduce((sum, qty) => sum + qty, 0);
          return total <= i.reorderPoint * 0.5;
        }).length,
        low: mockInventory.filter(i => {
          const total = Object.values(i.channels).reduce((sum, qty) => sum + qty, 0);
          return total <= i.reorderPoint && total > i.reorderPoint * 0.5;
        }).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validated = inventoryUpdateSchema.parse(body);

    // In production, this would update the database
    // For now, return success with the updated data
    return NextResponse.json({
      success: true,
      data: {
        productId: validated.productId,
        channelType: validated.channelType,
        newQuantity: validated.quantity,
        updatedAt: new Date(),
      },
      message: "Inventory updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}