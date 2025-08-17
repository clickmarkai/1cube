"use client";

import { useState } from "react";
import { Search, TrendingUp, Globe, Target, Lightbulb, AlertCircle, ExternalLink, BarChart } from "lucide-react";

interface CompetitorInsight {
  id: string;
  handle: string;
  platform: string;
  analysis: {
    angle: string;
    hook: string;
    proof: string;
    cta: string;
    complianceRisk: string;
    localAdaptation: string[];
  };
  metrics: {
    engagement: number;
    reach: number;
    sentiment: number;
  };
  timestamp: Date;
}

interface TrendAlert {
  id: string;
  type: "product" | "angle" | "platform" | "competitor";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: string;
  source: string;
}

export default function IntelligencePage() {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const platforms = [
    { id: "all", name: "All Platforms", icon: "🌐" },
    { id: "shopee", name: "shopee", icon: "🛍️" },
    { id: "tokopedia", name: "Tokopedia", icon: "🟢" },
    { id: "tiktok", name: "TikTok", icon: "📱" },
    { id: "instagram", name: "Instagram", icon: "📸" },
    { id: "lazada", name: "Lazada", icon: "🔵" },
  ];

  const trendAlerts: TrendAlert[] = [
    {
      id: "1",
      type: "angle",
      title: "Morning Routine Content Surging",
      description: "Morning wellness routine content seeing 3x engagement on TikTok Shop",
      impact: "high",
      actionable: "Create morning routine bundle with video content",
      source: "TikTok Analytics"
    },
    {
      id: "2",
      type: "product",
      title: "Collagen + Vitamin C Combos Trending",
      description: "Bundle sales up 45% when collagen paired with Vitamin C",
      impact: "high",
      actionable: "Launch collagen + vitamin C bundle campaign",
      source: "Marketplace Data"
    },
    {
      id: "3",
      type: "competitor",
      title: "New Competitor: WellnessKu",
      description: "Fast-growing brand captured 8% market share in 3 months",
      impact: "medium",
      actionable: "Analyze their influencer strategy and pricing",
      source: "Market Research"
    },
    {
      id: "4",
      type: "platform",
      title: "Shopee Live Commerce Update",
      description: "New live shopping features driving 2x conversion rates",
      impact: "medium",
      actionable: "Schedule weekly live sessions on Shopee",
      source: "Platform Updates"
    },
  ];

  const topCompetitors = [
    { name: "SehatAlami", marketShare: 18, growth: 12, strength: "Content quality" },
    { name: "WellnessKu", marketShare: 8, growth: 45, strength: "Influencer marketing" },
    { name: "VitaBoost", marketShare: 15, growth: -5, strength: "Product variety" },
    { name: "NatureCare", marketShare: 12, growth: 8, strength: "Local partnerships" },
  ];

  const handleAnalyze = () => {
    if (!competitorUrl) return;

    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const newInsight: CompetitorInsight = {
        id: Date.now().toString(),
        handle: competitorUrl,
        platform: "instagram",
        analysis: {
          angle: "Natural wellness transformation",
          hook: "Tired of feeling exhausted every morning?",
          proof: "10,000+ happy customers, clinical studies",
          cta: "Start your 30-day transformation - Link in bio",
          complianceRisk: "Low - avoids direct medical claims",
          localAdaptation: [
            "Add Indonesian testimonials",
            "Include halal certification prominently",
            "Reference local wellness traditions",
            "Use WhatsApp for customer service",
            "Price in IDR with local payment methods"
          ]
        },
        metrics: {
          engagement: 4.8,
          reach: 125000,
          sentiment: 85
        },
        timestamp: new Date()
      };

      setInsights([newInsight, ...insights]);
      setIsAnalyzing(false);
      setCompetitorUrl("");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Market Intelligence</h1>
        <p className="text-gray-600 mt-1">Competitor analysis, trends, and market insights</p>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="flex space-x-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter competitor URL or @handle to analyze..."
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !competitorUrl}
            className="btn-primary px-6 flex items-center"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Trend Alerts & Competitors */}
        <div className="space-y-6">
          {/* Trend Radar */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Trend Radar
            </h3>
            <div className="space-y-3">
              {trendAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.impact === "high" ? "border-red-200 bg-red-50" :
                    alert.impact === "medium" ? "border-yellow-200 bg-yellow-50" :
                    "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.type === "angle" ? "bg-purple-100 text-purple-700" :
                      alert.type === "product" ? "bg-blue-100 text-blue-700" :
                      alert.type === "competitor" ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                  <div className="flex items-start">
                    <Lightbulb className="h-3 w-3 text-primary mr-1 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-primary font-medium">{alert.actionable}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Competitors */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Top Competitors
            </h3>
            <div className="space-y-3">
              {topCompetitors.map((competitor) => (
                <div key={competitor.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{competitor.name}</span>
                    <span className="text-sm text-gray-500">{competitor.marketShare}% share</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`flex items-center ${
                      competitor.growth > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {competitor.growth > 0 ? "+" : ""}{competitor.growth}% growth
                    </span>
                    <span className="text-gray-500">{competitor.strength}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Analysis Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Platform Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedPlatform === platform.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>

          {/* Analysis Results */}
          {insights.length === 0 ? (
            <div className="card text-center py-12">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No competitor analysis yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Enter a competitor URL or handle to start analyzing
              </p>
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{insight.handle}</h4>
                    <p className="text-sm text-gray-500">
                      Analyzed on {new Date(insight.timestamp).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <a
                    href={`https://${insight.platform}.com/${insight.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                  </a>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{insight.metrics.engagement}%</p>
                    <p className="text-sm text-gray-500">Engagement Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {(insight.metrics.reach / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-gray-500">Reach</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{insight.metrics.sentiment}%</p>
                    <p className="text-sm text-gray-500">Positive Sentiment</p>
                  </div>
                </div>

                {/* Analysis */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Content Analysis</h5>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><strong>Angle:</strong> {insight.analysis.angle}</div>
                      <div><strong>Hook:</strong> "{insight.analysis.hook}"</div>
                      <div><strong>Social Proof:</strong> {insight.analysis.proof}</div>
                      <div><strong>CTA:</strong> {insight.analysis.cta}</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Compliance Risk</h5>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      insight.analysis.complianceRisk.includes("Low") 
                        ? "bg-green-100 text-green-700"
                        : insight.analysis.complianceRisk.includes("Medium")
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {insight.analysis.complianceRisk}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Indonesian Market Adaptation</h5>
                    <ul className="space-y-1">
                      {insight.analysis.localAdaptation.map((tip, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <span className="text-primary mr-2">•</span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}