"use client";

import { useState } from "react";
import { FileText, Sparkles, Globe, AlertCircle, TrendingUp, Copy, RefreshCw } from "lucide-react";
import { wellnessCopyPrompts, checkCompliance, trendingAngles } from "@/lib/prompts/wellness-copy";

interface GeneratedContent {
  id: string;
  prompt: string;
  content: string;
  language: "id" | "en";
  angle: string;
  complianceIssues: Array<{text: string, risk: string, suggestion: string}>;
  timestamp: Date;
}

export default function ContentPage() {
  const [selectedAngle, setSelectedAngle] = useState("transformation");
  const [selectedLanguage, setSelectedLanguage] = useState<"id" | "en">("id");
  const [productInfo, setProductInfo] = useState({
    name: "",
    category: "",
    benefits: "",
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const angles = [
    { id: "transformation", name: "Transformation Story", icon: "✨" },
    { id: "community", name: "Community Building", icon: "👥" },
    { id: "routine", name: "Daily Routine", icon: "🌅" },
    { id: "bundle", name: "Bundle Offer", icon: "🎁" },
  ];

  const handleGenerate = async () => {
    if (!productInfo.name || !productInfo.benefits) {
      alert("Please fill in product name and benefits");
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const mockContent = selectedLanguage === "id" 
        ? `✨ ${productInfo.name} - Transformasi Sehatmu Dimulai! ✨\n\n${productInfo.benefits}\n\nRibuan wanita Indonesia sudah membuktikan hasilnya dalam 14 hari!\n\n🎁 PROMO SPESIAL HARI INI\nBeli 2 GRATIS 1 + Free Ongkir\n\n📲 Pesan sekarang via link di bio!\n\n#WellnessIndonesia #${productInfo.name.replace(/\s+/g, '')} #SehatAlami`
        : `✨ Transform Your Wellness Journey with ${productInfo.name}! ✨\n\n${productInfo.benefits}\n\nJoin thousands who've seen results in just 14 days!\n\n🎁 TODAY'S SPECIAL OFFER\nBuy 2 Get 1 FREE + Free Shipping\n\n📲 Order now via link in bio!\n\n#WellnessJourney #${productInfo.name.replace(/\s+/g, '')} #HealthyLiving`;

      const complianceIssues = checkCompliance(mockContent);

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        prompt: `${selectedAngle} for ${productInfo.name}`,
        content: mockContent,
        language: selectedLanguage,
        angle: selectedAngle,
        complianceIssues,
        timestamp: new Date(),
      };

      setGeneratedContent([newContent, ...generatedContent]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification
  };

  const handleRegenerate = (id: string) => {
    const content = generatedContent.find(c => c.id === id);
    if (content) {
      setProductInfo({
        name: productInfo.name,
        category: productInfo.category,
        benefits: productInfo.benefits,
      });
      setSelectedAngle(content.angle);
      setSelectedLanguage(content.language);
      handleGenerate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Studio</h1>
        <p className="text-gray-600 mt-1">AI-powered content generation for wellness products</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Info */}
          <div className="card">
            <h3 className="font-semibold mb-4">Product Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label block mb-2">Product Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Vitamin C Serum"
                  value={productInfo.name}
                  onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label block mb-2">Category</label>
                <select
                  className="input w-full"
                  value={productInfo.category}
                  onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="skincare">Skincare</option>
                  <option value="supplements">Supplements</option>
                  <option value="fitness">Fitness</option>
                  <option value="healthy-food">Healthy Food</option>
                </select>
              </div>
              <div>
                <label className="label block mb-2">Key Benefits</label>
                <textarea
                  className="input w-full h-24"
                  placeholder="e.g., Brightens skin, reduces dark spots, boosts collagen"
                  value={productInfo.benefits}
                  onChange={(e) => setProductInfo({ ...productInfo, benefits: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="card">
            <h3 className="font-semibold mb-4">Content Settings</h3>
            
            {/* Language Toggle */}
            <div className="mb-4">
              <label className="label block mb-2">Language</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedLanguage("id")}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    selectedLanguage === "id"
                      ? "bg-primary text-white border-primary"
                      : "border-gray-300 hover:border-primary"
                  }`}
                >
                  🇮🇩 Bahasa
                </button>
                <button
                  onClick={() => setSelectedLanguage("en")}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    selectedLanguage === "en"
                      ? "bg-primary text-white border-primary"
                      : "border-gray-300 hover:border-primary"
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {/* Angle Selection */}
            <div>
              <label className="label block mb-2">Content Angle</label>
              <div className="grid grid-cols-2 gap-2">
                {angles.map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => setSelectedAngle(angle.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedAngle === angle.id
                        ? "bg-primary-lighter border-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl mb-1">{angle.icon}</div>
                    <div className="text-xs font-medium">{angle.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Generated Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Trending Angles */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Trending Angles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trendingAngles.slice(0, 6).map((angle) => (
                <div key={angle.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{angle.name}</span>
                    <span className="text-xs text-primary font-semibold">{angle.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${angle.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Results */}
          {generatedContent.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No content generated yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Fill in product details and click generate to start
              </p>
            </div>
          ) : (
            generatedContent.map((content) => (
              <div key={content.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        {angles.find(a => a.id === content.angle)?.name}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">
                        {content.language === "id" ? "Bahasa Indonesia" : "English"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(content.timestamp).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(content.content)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleRegenerate(content.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <pre className="whitespace-pre-wrap text-sm">{content.content}</pre>
                </div>

                {/* Compliance Check */}
                {content.complianceIssues.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">Compliance Issues</span>
                    </div>
                    <ul className="space-y-2">
                      {content.complianceIssues.map((issue, index) => (
                        <li key={index} className="text-sm">
                          <span className={`font-medium ${
                            issue.risk === "high" ? "text-red-600" :
                            issue.risk === "medium" ? "text-yellow-600" :
                            "text-gray-600"
                          }`}>
                            [{issue.risk.toUpperCase()}]
                          </span>
                          <span className="text-gray-700 ml-2">"{issue.text}"</span>
                          <p className="text-xs text-gray-600 mt-1 ml-4">
                            💡 {issue.suggestion}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}