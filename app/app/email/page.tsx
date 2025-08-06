"use client";

import { useState } from "react";
import { Mail, Users, TrendingUp, DollarSign, Play, Pause, Edit, Plus, Clock, CheckCircle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface EmailFlow {
  id: string;
  name: string;
  type: "welcome" | "abandoned_cart" | "post_purchase" | "win_back" | "custom";
  status: "active" | "draft" | "paused";
  emails: number;
  avgOpenRate: number;
  avgClickRate: number;
  revenue: number;
  subscribers: number;
  lastUpdated: Date;
}

interface EmailSegment {
  id: string;
  name: string;
  criteria: string[];
  size: number;
  growthRate: number;
}

const mockFlows: EmailFlow[] = [
  {
    id: "1",
    name: "Welcome Series",
    type: "welcome",
    status: "active",
    emails: 3,
    avgOpenRate: 45.2,
    avgClickRate: 12.8,
    revenue: 3450000,
    subscribers: 1250,
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    name: "Abandoned Cart Recovery",
    type: "abandoned_cart",
    status: "active",
    emails: 4,
    avgOpenRate: 38.5,
    avgClickRate: 15.2,
    revenue: 8750000,
    subscribers: 3200,
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    name: "Post-Purchase Follow-up",
    type: "post_purchase",
    status: "active",
    emails: 2,
    avgOpenRate: 52.1,
    avgClickRate: 8.5,
    revenue: 2100000,
    subscribers: 2800,
    lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    name: "Win-Back Campaign",
    type: "win_back",
    status: "draft",
    emails: 3,
    avgOpenRate: 0,
    avgClickRate: 0,
    revenue: 0,
    subscribers: 0,
    lastUpdated: new Date(),
  },
  {
    id: "5",
    name: "VIP Customer Journey",
    type: "custom",
    status: "active",
    emails: 5,
    avgOpenRate: 58.3,
    avgClickRate: 18.7,
    revenue: 12500000,
    subscribers: 450,
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

const mockSegments: EmailSegment[] = [
  {
    id: "1",
    name: "High-Value Customers",
    criteria: ["Order Value > 1M IDR", "Orders > 3", "Last 90 days"],
    size: 850,
    growthRate: 12.5,
  },
  {
    id: "2",
    name: "First-Time Buyers",
    criteria: ["Orders = 1", "Last 30 days"],
    size: 2340,
    growthRate: 25.8,
  },
  {
    id: "3",
    name: "Dormant Customers",
    criteria: ["No orders", "Last 90-180 days", "Previously active"],
    size: 1560,
    growthRate: -5.2,
  },
  {
    id: "4",
    name: "Skincare Enthusiasts",
    criteria: ["Purchased skincare", "Open rate > 40%"],
    size: 3200,
    growthRate: 18.3,
  },
];

const emailTemplates = [
  { id: "welcome-1", name: "Welcome Email 1: Brand Story", category: "welcome" },
  { id: "welcome-2", name: "Welcome Email 2: Best Sellers", category: "welcome" },
  { id: "welcome-3", name: "Welcome Email 3: First Purchase Discount", category: "welcome" },
  { id: "cart-1", name: "Cart Recovery 1: Gentle Reminder", category: "abandoned_cart" },
  { id: "cart-2", name: "Cart Recovery 2: Social Proof", category: "abandoned_cart" },
  { id: "cart-3", name: "Cart Recovery 3: Limited Discount", category: "abandoned_cart" },
  { id: "post-1", name: "Post-Purchase 1: Thank You", category: "post_purchase" },
  { id: "post-2", name: "Post-Purchase 2: How to Use", category: "post_purchase" },
  { id: "win-1", name: "Win-Back 1: We Miss You", category: "win_back" },
  { id: "win-2", name: "Win-Back 2: Exclusive Offer", category: "win_back" },
];

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<"flows" | "segments" | "templates">("flows");
  const [selectedFlow, setSelectedFlow] = useState<EmailFlow | null>(null);

  const totalRevenue = mockFlows.reduce((sum, flow) => sum + flow.revenue, 0);
  const totalSubscribers = mockFlows.reduce((sum, flow) => sum + flow.subscribers, 0);
  const avgOpenRate = mockFlows.filter(f => f.status === "active").reduce((sum, f) => sum + f.avgOpenRate, 0) / 
                      mockFlows.filter(f => f.status === "active").length;
  const avgClickRate = mockFlows.filter(f => f.status === "active").reduce((sum, f) => sum + f.avgClickRate, 0) / 
                       mockFlows.filter(f => f.status === "active").length;

  const getFlowIcon = (type: string) => {
    const icons: Record<string, string> = {
      welcome: "👋",
      abandoned_cart: "🛒",
      post_purchase: "📦",
      win_back: "💔",
      custom: "⚡",
    };
    return icons[type] || "📧";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-1">Automated flows and segmentation powered by Klaviyo</p>
        </div>
        <button className="btn-primary px-4 py-2 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Flow
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Email Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600">+23.5% vs last month</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Subscribers</p>
              <p className="text-2xl font-bold">{formatNumber(totalSubscribers)}</p>
              <p className="text-xs text-green-600">+15.2% growth</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Open Rate</p>
              <p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Industry avg: 21.5%</p>
            </div>
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Click Rate</p>
              <p className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Industry avg: 2.6%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("flows")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "flows"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Email Flows
          </button>
          <button
            onClick={() => setActiveTab("segments")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "segments"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Segments
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === "templates"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Templates
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "flows" && (
        <div className="grid gap-4">
          {mockFlows.map((flow) => (
            <div key={flow.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{getFlowIcon(flow.type)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{flow.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        flow.status === "active" ? "bg-green-100 text-green-700" :
                        flow.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {flow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {flow.emails} emails • {formatNumber(flow.subscribers)} subscribers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Open Rate</p>
                    <p className="font-semibold">{flow.avgOpenRate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Click Rate</p>
                    <p className="font-semibold">{flow.avgClickRate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="font-semibold text-primary">{formatCurrency(flow.revenue)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      {flow.status === "active" ? (
                        <Pause className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Play className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Flow Timeline */}
              {flow.status === "active" && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    {Array.from({ length: flow.emails }).map((_, index) => (
                      <div key={index} className="flex items-center">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-xs text-gray-500 ml-2">
                            {index === 0 ? "Immediately" : `Day ${index * 3}`}
                          </p>
                        </div>
                        {index < flow.emails - 1 && (
                          <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "segments" && (
        <div className="grid md:grid-cols-2 gap-4">
          {mockSegments.map((segment) => (
            <div key={segment.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{segment.name}</h3>
                <span className={`text-sm flex items-center ${
                  segment.growthRate > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {segment.growthRate > 0 ? "+" : ""}{segment.growthRate}%
                </span>
              </div>
              
              <p className="text-2xl font-bold mb-3">{formatNumber(segment.size)} contacts</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Criteria:</p>
                {segment.criteria.map((criterion, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                    {criterion}
                  </div>
                ))}
              </div>

              <button className="btn-outline w-full mt-4">
                Create Campaign
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-6">
          {["welcome", "abandoned_cart", "post_purchase", "win_back"].map((category) => (
            <div key={category}>
              <h3 className="font-semibold text-lg mb-3 capitalize">
                {category.replace("_", " ")} Templates
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {emailTemplates
                  .filter((template) => template.category === category)
                  .map((template) => (
                    <div key={template.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Mail className="h-12 w-12 text-gray-400" />
                      </div>
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex justify-between items-center mt-3">
                        <button className="text-sm text-primary hover:underline">Preview</button>
                        <button className="btn-outline px-3 py-1 text-sm">Use Template</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}