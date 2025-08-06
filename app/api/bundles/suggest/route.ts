import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  productIds: z.array(z.string()).min(1).max(10),
  targetMargin: z.number().min(0).max(100).optional(),
  targetAOV: z.number().positive().optional(),
});

type BundleSuggestion = {
  id: string;
  name: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  discountedPrice: number;
  margin: number;
  projectedAOV: number;
  rationale: string;
  habitPairing: string;
  channels: string[];
};

// Mock product data
const mockProducts = {
  "1": { id: "1", name: "Vitamin C Serum", price: 350000, cost: 150000 },
  "2": { id: "2", name: "Collagen Supplement", price: 450000, cost: 200000 },
  "3": { id: "3", name: "Omega-3 Capsules", price: 380000, cost: 180000 },
  "4": { id: "4", name: "Protein Powder", price: 580000, cost: 250000 },
  "5": { id: "5", name: "Probiotic Drink", price: 120000, cost: 50000 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Generate AI-powered bundle suggestions
    const suggestions: BundleSuggestion[] = [];

    // Morning Routine Bundle
    if (validated.productIds.includes("1") && validated.productIds.includes("5")) {
      const bundle: BundleSuggestion = {
        id: "bundle-1",
        name: "Morning Glow Bundle",
        products: [
          { ...mockProducts["1"], quantity: 1 },
          { ...mockProducts["5"], quantity: 30 },
        ],
        totalPrice: 350000 + (120000 * 30),
        discountedPrice: 3500000, // 20% discount
        margin: 58,
        projectedAOV: 3500000,
        rationale: "Perfect morning routine combination - Vitamin C for skin glow + Probiotics for gut health. Indonesian customers love routine bundles.",
        habitPairing: "Take probiotic drink first thing in the morning, apply Vitamin C serum after morning cleanse",
        channels: ["shopee", "tokopedia", "tiktok"],
      };
      suggestions.push(bundle);
    }

    // Wellness Complete Bundle
    if (validated.productIds.length >= 3) {
      const selectedProducts = validated.productIds.slice(0, 3);
      let totalPrice = 0;
      let totalCost = 0;
      const bundleProducts = selectedProducts.map(id => {
        const product = mockProducts[id as keyof typeof mockProducts];
        totalPrice += product.price;
        totalCost += product.cost;
        return { ...product, quantity: 1 };
      });

      const bundle: BundleSuggestion = {
        id: "bundle-2",
        name: "Complete Wellness Package",
        products: bundleProducts,
        totalPrice,
        discountedPrice: Math.round(totalPrice * 0.85), // 15% discount
        margin: Math.round(((totalPrice * 0.85 - totalCost) / (totalPrice * 0.85)) * 100),
        projectedAOV: Math.round(totalPrice * 0.85),
        rationale: "Comprehensive wellness solution targeting multiple health aspects. Bundle pricing encourages higher cart value.",
        habitPairing: "Morning: supplements, Evening: skincare routine",
        channels: ["shopee", "tokopedia", "lazada"],
      };
      suggestions.push(bundle);
    }

    // High-margin bundle
    if (validated.targetMargin && validated.targetMargin > 50) {
      const highMarginProducts = Object.values(mockProducts)
        .filter(p => ((p.price - p.cost) / p.price) * 100 > 50)
        .slice(0, 2);
      
      if (highMarginProducts.length >= 2) {
        const bundle: BundleSuggestion = {
          id: "bundle-3",
          name: "Premium Selection",
          products: highMarginProducts.map(p => ({ ...p, quantity: 1 })),
          totalPrice: highMarginProducts.reduce((sum, p) => sum + p.price, 0),
          discountedPrice: highMarginProducts.reduce((sum, p) => sum + p.price, 0) * 0.9,
          margin: 65,
          projectedAOV: highMarginProducts.reduce((sum, p) => sum + p.price, 0) * 0.9,
          rationale: "High-margin products bundled for maximum profitability while maintaining value perception.",
          habitPairing: "Premium daily wellness routine",
          channels: ["tokopedia", "blibli"],
        };
        suggestions.push(bundle);
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        totalSuggestions: suggestions.length,
        averageMargin: Math.round(
          suggestions.reduce((sum, s) => sum + s.margin, 0) / suggestions.length
        ),
        averageAOV: Math.round(
          suggestions.reduce((sum, s) => sum + s.projectedAOV, 0) / suggestions.length
        ),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}