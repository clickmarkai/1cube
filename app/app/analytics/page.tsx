"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Filter,
  Download,
} from "lucide-react";

const kpiData = [
  { title: "Total Revenue", value: "Rp 2.8B", change: 12.5, trend: "up", icon: DollarSign },
  { title: "Total Orders", value: "5,695", change: 8.3, trend: "up", icon: ShoppingCart },
  { title: "Average AOV", value: "Rp 450K", change: 6.8, trend: "up", icon: Target },
  { title: "Conversion Rate", value: "3.2%", change: 15.3, trend: "up", icon: Users },
];

const channelData = [
  { name: "Shopee", revenue: "Rp 996M", percentage: 35, color: "bg-orange-500" },
  { name: "Tokopedia", revenue: "Rp 797M", percentage: 28, color: "bg-green-500" },
  { name: "TikTok Shop", revenue: "Rp 569M", percentage: 20, color: "bg-black" },
  { name: "Lazada", revenue: "Rp 284M", percentage: 10, color: "bg-blue-500" },
  { name: "Others", revenue: "Rp 199M", percentage: 7, color: "bg-gray-400" },
];

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  
  console.log('📈 Analytics page component rendering...');
  
  React.useEffect(() => {
    console.log('📈 Analytics page mounted and ready');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Unified insights across all channels</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="btn-outline flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <div className="flex items-center mt-1">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.change}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary-lighter rounded-lg">
                <kpi.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Channel Revenue Mix</h3>
          <div className="space-y-4">
            {channelData.map((channel, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${channel.color} mr-3`}></div>
                  <span className="text-sm font-medium">{channel.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{channel.revenue}</div>
                  <div className="text-xs text-gray-500">{channel.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {[
              { name: "Vitamin C Serum", revenue: "Rp 245M", growth: "+12%" },
              { name: "Protein Powder", revenue: "Rp 189M", growth: "+8%" },
              { name: "Yoga Mat Premium", revenue: "Rp 156M", growth: "+15%" },
              { name: "Immunity Boost", revenue: "Rp 134M", growth: "+5%" },
              { name: "Collagen Peptides", revenue: "Rp 98M", growth: "+22%" },
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.revenue}</div>
                </div>
                <div className="text-sm text-green-600">{product.growth}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">4.2x</div>
            <div className="text-sm text-gray-600">Average ROAS</div>
            <div className="text-xs text-green-600 mt-1">+8.3% from last period</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">125K</div>
            <div className="text-sm text-gray-600">Avg CAC</div>
            <div className="text-xs text-green-600 mt-1">-5.2% from last period</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">1.85M</div>
            <div className="text-sm text-gray-600">Customer LTV</div>
            <div className="text-xs text-green-600 mt-1">+15.3% from last period</div>
          </div>
        </div>
      </div>

      {/* Channel Breakdown Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Detailed Channel Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AOV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROAS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { channel: "Shopee", revenue: "Rp 996M", orders: "2,213", aov: "Rp 450K", roas: "4.8x", growth: "+12%" },
                { channel: "Tokopedia", revenue: "Rp 797M", orders: "1,772", aov: "Rp 450K", roas: "4.2x", growth: "+8%" },
                { channel: "TikTok Shop", revenue: "Rp 569M", orders: "1,265", aov: "Rp 450K", roas: "3.9x", growth: "+25%" },
                { channel: "Lazada", revenue: "Rp 284M", orders: "632", aov: "Rp 450K", roas: "3.5x", growth: "+5%" },
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.channel}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.revenue}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.orders}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.aov}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{row.roas}</td>
                  <td className="px-6 py-4 text-sm text-green-600">{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}