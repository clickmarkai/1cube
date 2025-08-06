import { NextResponse } from "next/server";
import { z } from "zod";
import { mockProducts } from "@/lib/mock-data";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  price: z.number().positive(),
  cost: z.number().positive(),
});

export async function GET() {
  try {
    // In production, this would fetch from the database
    return NextResponse.json({
      success: true,
      data: mockProducts,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = productSchema.parse(body);

    // In production, this would create in the database
    const newProduct = {
      id: Date.now().toString(),
      ...validated,
      stock: 0,
    };

    return NextResponse.json({
      success: true,
      data: newProduct,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}