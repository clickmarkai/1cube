import { NextResponse } from "next/server";
import { z } from "zod";
import { ai } from "@/lib/ai";
import { wellnessCopyPrompts, checkCompliance } from "@/lib/prompts/wellness-copy";

const generateSchema = z.object({
  productName: z.string().min(1),
  category: z.string(),
  benefits: z.string(),
  angle: z.enum(["transformation", "community", "routine", "bundle"]),
  language: z.enum(["id", "en"]),
  tone: z.enum(["professional", "casual", "friendly"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = generateSchema.parse(body);

    // Get the appropriate prompt template
    const promptTemplate = wellnessCopyPrompts[validated.angle][validated.language];
    
    // Replace placeholders in the prompt
    const prompt = promptTemplate
      .replace("{productName}", validated.productName)
      .replace("{category}", validated.category)
      .replace("{benefits}", validated.benefits);

    // Generate content using AI
    const generatedContent = await ai.generateContent(prompt, {
      language: validated.language,
      tone: validated.tone || "friendly",
      temperature: 0.7,
      maxTokens: 500,
    });

    // Check compliance
    const complianceIssues = checkCompliance(generatedContent);

    return NextResponse.json({
      success: true,
      data: {
        content: generatedContent,
        language: validated.language,
        angle: validated.angle,
        complianceIssues,
        metadata: {
          productName: validated.productName,
          category: validated.category,
          timestamp: new Date(),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Content generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate content" },
      { status: 500 }
    );
  }
}