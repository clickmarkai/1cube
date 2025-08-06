"use client";

import { useState } from "react";
import { MessageCircle, Bot, Users, TrendingUp, Upload, Send, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Intent {
  id: string;
  name: string;
  examples: string[];
  response: string;
  category: string;
  usage: number;
  accuracy: number;
}

interface ChatPreview {
  role: "user" | "bot";
  message: string;
  timestamp: Date;
}

const mockIntents: Intent[] = [
  {
    id: "1",
    name: "product_inquiry",
    examples: ["What products do you have?", "Show me skincare", "Do you sell vitamins?"],
    response: "We offer a wide range of wellness products including skincare, supplements, and healthy foods. What category interests you?",
    category: "Product",
    usage: 1250,
    accuracy: 92,
  },
  {
    id: "2",
    name: "order_status",
    examples: ["Where is my order?", "Track my package", "Order status"],
    response: "I can help you track your order. Please provide your order number or email address.",
    category: "Support",
    usage: 890,
    accuracy: 88,
  },
  {
    id: "3",
    name: "product_recommendation",
    examples: ["What do you recommend?", "Best product for skin", "Suggest supplements"],
    response: "I'd be happy to recommend products! Could you tell me more about your wellness goals?",
    category: "Sales",
    usage: 650,
    accuracy: 85,
  },
  {
    id: "4",
    name: "pricing",
    examples: ["How much?", "Price list", "Any discounts?"],
    response: "Our prices vary by product. We often have bundle deals and promotions! Would you like to see our current offers?",
    category: "Sales",
    usage: 520,
    accuracy: 90,
  },
  {
    id: "5",
    name: "shipping_info",
    examples: ["Shipping cost?", "How long delivery?", "Free shipping?"],
    response: "We offer free shipping for orders above Rp 200,000. Standard delivery takes 2-3 days for Jabodetabek, 3-5 days for other areas.",
    category: "Support",
    usage: 780,
    accuracy: 94,
  },
  {
    id: "6",
    name: "return_policy",
    examples: ["Can I return?", "Refund policy", "Exchange product"],
    response: "We have a 30-day return policy for unopened products. For quality issues, we offer full refunds or exchanges.",
    category: "Support",
    usage: 320,
    accuracy: 91,
  },
];

const mockConversation: ChatPreview[] = [
  { role: "user", message: "Hi, I'm looking for skincare products", timestamp: new Date(Date.now() - 300000) },
  { role: "bot", message: "Hello! Welcome to 1Cube Wellness. We have a great selection of skincare products including serums, moisturizers, and face masks. What specific skin concerns do you have?", timestamp: new Date(Date.now() - 290000) },
  { role: "user", message: "I have dry skin and some dark spots", timestamp: new Date(Date.now() - 180000) },
  { role: "bot", message: "For dry skin and dark spots, I recommend our Vitamin C Serum paired with our Retinol Night Cream. The Vitamin C helps brighten dark spots while the Retinol cream provides deep hydration. Would you like to know more about these products?", timestamp: new Date(Date.now() - 170000) },
  { role: "user", message: "Yes, and do you have any promotions?", timestamp: new Date(Date.now() - 60000) },
  { role: "bot", message: "Great choice! We currently have a Skincare Bundle promotion - buy the Vitamin C Serum + Retinol Night Cream together and get 20% off! That's Rp 816,000 (originally Rp 1,020,000). Plus, free shipping! Would you like me to add this to your cart?", timestamp: new Date(Date.now() - 50000) },
];

const categories = ["All", "Product", "Sales", "Support"];

export default function ChatbotPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatPreview[]>(mockConversation);
  const [activeTab, setActiveTab] = useState<"intents" | "knowledge" | "test">("intents");
  const [editingIntent, setEditingIntent] = useState<Intent | null>(null);

  const filteredIntents = selectedCategory === "All" 
    ? mockIntents 
    : mockIntents.filter(intent => intent.category === selectedCategory);

  const totalUsage = mockIntents.reduce((sum, intent) => sum + intent.usage, 0);
  const avgAccuracy = mockIntents.reduce((sum, intent) => sum + intent.accuracy, 0) / mockIntents.length;

  const handleSendMessage = () => {
    if (!testMessage.trim()) return;

    const newUserMessage: ChatPreview = {
      role: "user",
      message: testMessage,
      timestamp: new Date(),
    };

    // Simulate bot response
    const botResponse: ChatPreview = {
      role: "bot",
      message: "Thanks for your message! In a real implementation, I would use AI to understand your intent and provide a relevant response. For now, I can help you with product inquiries, order tracking, and recommendations.",
      timestamp: new Date(),
    };

    setChatHistory([...chatHistory, newUserMessage, botResponse]);
    setTestMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Service Chatbot</h1>
          <p className="text-gray-600 mt-1">AI-powered support with product finder and FAQ automation</p>
        </div>
        <button className="btn-primary px-4 py-2 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Intent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Conversations</p>
              <p className="text-2xl font-bold">{formatNumber(totalUsage)}</p>
              <p className="text-xs text-green-600">+18.5% this week</p>
            </div>
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Intents</p>
              <p className="text-2xl font-bold">{mockIntents.length}</p>
              <p className="text-xs text-gray-500">6 categories</p>
            </div>
            <Bot className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Accuracy</p>
              <p className="text-2xl font-bold">{avgAccuracy.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">Industry avg: 75%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-bold">78%</p>
              <p className="text-xs text-green-600">+5% improvement</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("intents")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "intents"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Intents Manager
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "knowledge"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab("test")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "test"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Test Widget
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "intents" && (
        <div>
          {/* Category Filter */}
          <div className="flex space-x-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Intents List */}
          <div className="space-y-4">
            {filteredIntents.map((intent) => (
              <div key={intent.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">{intent.name.replace("_", " ").toUpperCase()}</h3>
                      <span className="text-sm px-2 py-1 bg-primary-lighter text-primary rounded-full">
                        {intent.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatNumber(intent.usage)} uses
                      </span>
                      <span className={`text-sm ${
                        intent.accuracy >= 90 ? "text-green-600" : 
                        intent.accuracy >= 80 ? "text-yellow-600" : 
                        "text-red-600"
                      }`}>
                        {intent.accuracy}% accuracy
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Example phrases:</p>
                      <div className="flex flex-wrap gap-2">
                        {intent.examples.map((example, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            "{example}"
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                      <p className="text-sm text-gray-600">{intent.response}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingIntent(intent)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "knowledge" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4">Product Knowledge</h3>
            <div className="card">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Product Catalog</span>
                  <span className="text-xs text-green-600">Synced</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Pricing Rules</span>
                  <span className="text-xs text-green-600">Updated</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Bundle Information</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
              <button className="btn-outline w-full mt-4 flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload Knowledge Base
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">FAQ Management</h3>
            <div className="card">
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="font-medium text-sm">How long is shipping?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    2-3 days for Jabodetabek, 3-5 days for other areas
                  </p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium text-sm">What's your return policy?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    30 days for unopened products
                  </p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium text-sm">Do you offer free shipping?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Yes, for orders above Rp 200,000
                  </p>
                </div>
              </div>
              <button className="btn-outline w-full mt-4">
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "test" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chat Preview */}
          <div>
            <h3 className="font-semibold mb-4">Chat Preview</h3>
            <div className="card h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${
                      msg.role === "user" 
                        ? "bg-primary text-white rounded-l-lg rounded-br-lg" 
                        : "bg-gray-100 rounded-r-lg rounded-bl-lg"
                    } p-3`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-white/70" : "text-gray-500"
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Type a message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="btn-primary px-4"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Widget Settings */}
          <div>
            <h3 className="font-semibold mb-4">Widget Configuration</h3>
            <div className="card space-y-4">
              <div>
                <label className="label block mb-2">Widget Position</label>
                <select className="input w-full">
                  <option>Bottom Right</option>
                  <option>Bottom Left</option>
                  <option>Center</option>
                </select>
              </div>

              <div>
                <label className="label block mb-2">Welcome Message</label>
                <textarea
                  className="input w-full h-24"
                  defaultValue="Hi! 👋 Welcome to 1Cube Wellness. How can I help you today?"
                />
              </div>

              <div>
                <label className="label block mb-2">Primary Color</label>
                <div className="flex space-x-2">
                  <div className="h-10 w-10 rounded bg-primary cursor-pointer border-2 border-gray-300"></div>
                  <div className="h-10 w-10 rounded bg-blue-500 cursor-pointer"></div>
                  <div className="h-10 w-10 rounded bg-green-500 cursor-pointer"></div>
                  <div className="h-10 w-10 rounded bg-purple-500 cursor-pointer"></div>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm">Show on all pages</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm">Enable product finder</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm">Collect email for human handoff</span>
                </label>
              </div>

              <button className="btn-primary w-full">
                Save Widget Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}