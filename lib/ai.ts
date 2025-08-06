import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
});

export interface AIProvider {
  generateContent: (prompt: string, options?: GenerateOptions) => Promise<string>;
  analyzeCompetitor: (data: CompetitorData) => Promise<CompetitorAnalysis>;
  predictCampaignPerformance: (campaign: CampaignData) => Promise<PerformancePrediction>;
  detectDeadAd: (metrics: AdMetrics) => Promise<DeadAdDetection>;
}

interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  language?: 'id' | 'en';
  tone?: 'professional' | 'casual' | 'friendly';
}

interface CompetitorData {
  handle: string;
  platform: string;
  adContent?: string;
  metrics?: Record<string, any>;
}

interface CompetitorAnalysis {
  angle: string;
  hook: string;
  proof: string;
  cta: string;
  complianceRisk: string;
  localAdaptation: string[];
}

interface CampaignData {
  name: string;
  channels: string[];
  budget: number;
  targetAudience: string;
  creatives: string[];
}

interface PerformancePrediction {
  projectedROAS: number;
  estimatedReach: number;
  confidenceScore: number;
  recommendations: string[];
}

interface AdMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpa: number;
  daysSinceStart: number;
}

interface DeadAdDetection {
  isDead: boolean;
  score: number;
  reasons: string[];
  recommendation: string;
}

class OpenAIProvider implements AIProvider {
  async generateContent(prompt: string, options: GenerateOptions = {}): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI copywriter specialized in Indonesian wellness e-commerce. 
            Focus on transformation stories, community building, and healthy routines. 
            Avoid medical claims and miracle cures. 
            Use respectful Indonesian slang when appropriate.
            Language: ${options.language === 'id' ? 'Indonesian' : 'English'}
            Tone: ${options.tone || 'friendly'}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to mock response
      return this.getMockContent(prompt, options);
    }
  }

  async analyzeCompetitor(data: CompetitorData): Promise<CompetitorAnalysis> {
    const prompt = `Analyze this competitor's wellness e-commerce strategy:
    Handle: ${data.handle}
    Platform: ${data.platform}
    ${data.adContent ? `Ad Content: ${data.adContent}` : ''}
    
    Extract:
    1. Main angle/positioning
    2. Hook used
    3. Social proof elements
    4. Call to action
    5. Compliance risks (health claims)
    6. How to adapt for Indonesian market`;

    try {
      const response = await this.generateContent(prompt);
      // Parse the response into structured data
      return this.parseCompetitorAnalysis(response);
    } catch (error) {
      return this.getMockCompetitorAnalysis();
    }
  }

  async predictCampaignPerformance(campaign: CampaignData): Promise<PerformancePrediction> {
    // Mock implementation - in production, this would use ML models
    const baseROAS = 3.5;
    const channelMultiplier = campaign.channels.length * 0.2;
    const budgetFactor = Math.log10(campaign.budget) / 10;
    
    return {
      projectedROAS: baseROAS + channelMultiplier + budgetFactor,
      estimatedReach: campaign.budget * 50,
      confidenceScore: 0.75,
      recommendations: [
        "Add TikTok Shop for younger audience reach",
        "Include transformation story angles in creatives",
        "Test morning routine messaging for supplements",
        "Add Indonesian testimonials for trust building"
      ]
    };
  }

  async detectDeadAd(metrics: AdMetrics): Promise<DeadAdDetection> {
    const ctrThreshold = 0.5;
    const cpaIncrease = 1.5;
    const isDead = metrics.ctr < ctrThreshold || 
                   (metrics.daysSinceStart > 7 && metrics.cpa > metrics.spend / metrics.conversions * cpaIncrease);

    const reasons = [];
    if (metrics.ctr < ctrThreshold) reasons.push(`CTR below ${ctrThreshold}%`);
    if (metrics.cpa > metrics.spend / metrics.conversions * cpaIncrease) {
      reasons.push(`CPA increased by ${Math.round((cpaIncrease - 1) * 100)}%`);
    }

    return {
      isDead,
      score: isDead ? 0.2 : 0.8,
      reasons,
      recommendation: isDead 
        ? "Pause ad and test new creative angles focusing on transformation stories"
        : "Ad is performing well, consider scaling budget"
    };
  }

  private getMockContent(prompt: string, options: GenerateOptions): string {
    if (options.language === 'id') {
      return `✨ Transformasi Sehatmu Dimulai Hari Ini! ✨

Ribuan wanita Indonesia sudah membuktikan:
✅ Kulit lebih cerah dalam 14 hari
✅ Energi meningkat sejak minggu pertama
✅ Tidur lebih nyenyak

"Awalnya ragu, tapi setelah 2 minggu rutin pakai, beneran kerasa bedanya!" - Ibu Siti, Jakarta

🎁 PROMO SPESIAL: Beli 2 GRATIS 1
⏰ Terbatas sampai hari ini!

Yuk mulai journey sehatmu sekarang 👇
[Link in Bio]

#WellnessIndonesia #TransformasiSehat #HealthyLifestyle`;
    }

    return `✨ Your Wellness Transformation Starts Today! ✨

Join thousands who've discovered:
✅ Radiant skin in 14 days
✅ Increased energy from week one
✅ Better sleep quality

"I was skeptical at first, but after 2 weeks of consistent use, the difference is real!" - Sarah, Jakarta

🎁 SPECIAL OFFER: Buy 2 Get 1 FREE
⏰ Limited time only!

Start your wellness journey now 👇
[Link in Bio]

#WellnessJourney #HealthTransformation #GlowUp`;
  }

  private parseCompetitorAnalysis(response: string): CompetitorAnalysis {
    // Mock parsing - in production, use proper NLP
    return {
      angle: "Natural wellness transformation",
      hook: "Tired of feeling exhausted every morning?",
      proof: "10,000+ happy customers, clinical studies",
      cta: "Start your 30-day transformation",
      complianceRisk: "Low - avoids direct medical claims",
      localAdaptation: [
        "Add Indonesian testimonials",
        "Include halal certification",
        "Reference local wellness traditions",
        "Use WhatsApp for customer service"
      ]
    };
  }

  private getMockCompetitorAnalysis(): CompetitorAnalysis {
    return {
      angle: "Holistic wellness approach",
      hook: "Discover the secret to all-day energy",
      proof: "Trusted by 50,000+ customers",
      cta: "Shop now and save 20%",
      complianceRisk: "Medium - some health benefit claims",
      localAdaptation: [
        "Emphasize community testimonials",
        "Add Bahasa Indonesia version",
        "Include local payment methods",
        "Reference Indonesian beauty standards"
      ]
    };
  }
}

// Export singleton instance
export const ai = new OpenAIProvider();

// Export mock driver for testing
export class MockAIProvider implements AIProvider {
  async generateContent(prompt: string, options?: GenerateOptions): Promise<string> {
    return `Mock content for: ${prompt}`;
  }

  async analyzeCompetitor(data: CompetitorData): Promise<CompetitorAnalysis> {
    return {
      angle: "Mock angle",
      hook: "Mock hook",
      proof: "Mock proof",
      cta: "Mock CTA",
      complianceRisk: "Low",
      localAdaptation: ["Mock adaptation"]
    };
  }

  async predictCampaignPerformance(campaign: CampaignData): Promise<PerformancePrediction> {
    return {
      projectedROAS: 4.0,
      estimatedReach: 100000,
      confidenceScore: 0.8,
      recommendations: ["Mock recommendation"]
    };
  }

  async detectDeadAd(metrics: AdMetrics): Promise<DeadAdDetection> {
    return {
      isDead: false,
      score: 0.9,
      reasons: [],
      recommendation: "Keep running"
    };
  }
}