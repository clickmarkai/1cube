"use client";

import React, { useState } from "react";
import { Plus, Play, Pause, BarChart, Target, Zap } from "lucide-react";

const mockCampaigns = [
  {
    id: 1,
    name: "Vitamin C Serum Launch",
    status: "running",
    budget: "Rp 5,000,000",
    spent: "Rp 2,340,000",
    roas: "4.2x",
    clicks: 1240,
    conversions: 89,
    channels: ["Facebook", "Google", "TikTok"],
  },
  {
    id: 2,
    name: "Protein Powder Campaign",
    status: "paused",
    budget: "Rp 3,500,000",
    spent: "Rp 3,100,000",
    roas: "3.8x",
    clicks: 980,
    conversions: 67,
    channels: ["Shopee Ads", "Tokopedia"],
  },
  {
    id: 3,
    name: "Yoga Mat Collection",
    status: "draft",
    budget: "Rp 2,000,000",
    spent: "Rp 0",
    roas: "-",
    clicks: 0,
    conversions: 0,
    channels: ["Instagram", "Facebook"],
  },
];

export default function CampaignsPage() {
  const [campaigns] = useState(mockCampaigns);
  
  console.log('🎯 Campaigns page component rendering...');
  
  React.useEffect(() => {
    console.log('🎯 Campaigns page mounted and ready');
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Manage your AI-powered marketing campaigns</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <BarChart className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold">Rp 15.2M</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-gray-600">Avg ROAS</p>
              <p className="text-2xl font-bold">4.1x</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl font-bold">432</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget / Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.clicks} clicks • {campaign.conversions} conversions
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{campaign.budget}</div>
                    <div className="text-sm text-gray-500">Spent: {campaign.spent}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ROAS: {campaign.roas}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {campaign.channels.map((channel) => (
                        <span
                          key={channel}
                          className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {campaign.status === "running" ? (
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="text-green-600 hover:text-green-900">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900">
                        <BarChart className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}