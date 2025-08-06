import { NextResponse } from "next/server";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

// Simple intent matching (in production, use NLP)
function matchIntent(message: string) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("berapa")) {
    return {
      intent: "pricing",
      response: "Our prices vary by product. We often have bundle deals and promotions! Would you like to see our current offers?",
    };
  }
  
  if (lowerMessage.includes("ship") || lowerMessage.includes("delivery") || lowerMessage.includes("kirim")) {
    return {
      intent: "shipping",
      response: "We offer free shipping for orders above Rp 200,000. Standard delivery takes 2-3 days for Jabodetabek, 3-5 days for other areas.",
    };
  }
  
  if (lowerMessage.includes("return") || lowerMessage.includes("refund") || lowerMessage.includes("kembali")) {
    return {
      intent: "returns",
      response: "We have a 30-day return policy for unopened products. For quality issues, we offer full refunds or exchanges.",
    };
  }
  
  if (lowerMessage.includes("product") || lowerMessage.includes("sell") || lowerMessage.includes("jual")) {
    return {
      intent: "products",
      response: "We offer a wide range of wellness products including skincare, supplements, and healthy foods. What category interests you?",
    };
  }
  
  if (lowerMessage.includes("order") || lowerMessage.includes("track") || lowerMessage.includes("pesanan")) {
    return {
      intent: "order_tracking",
      response: "I can help you track your order. Please provide your order number or email address.",
    };
  }
  
  // Default response
  return {
    intent: "unknown",
    response: "Thanks for your message! I can help you with product information, pricing, shipping, and order tracking. What would you like to know?",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = chatSchema.parse(body);
    
    // Match intent and get response
    const { intent, response } = matchIntent(validated.message);
    
    // Generate session ID if not provided
    const sessionId = validated.sessionId || Date.now().toString();
    
    // Simulate product recommendations for product inquiries
    let recommendations = null;
    if (intent === "products") {
      recommendations = [
        {
          id: "1",
          name: "Vitamin C Serum",
          price: 350000,
          image: "/images/vitamin-c-serum.jpg",
        },
        {
          id: "2",
          name: "Collagen Supplement",
          price: 450000,
          image: "/images/collagen.jpg",
        },
        {
          id: "3",
          name: "Omega-3 Capsules",
          price: 380000,
          image: "/images/omega3.jpg",
        },
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        message: response,
        intent,
        recommendations,
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

    return NextResponse.json(
      { success: false, error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}