"use client";

import { useState } from "react";
import { Package, AlertTriangle, TrendingDown, RefreshCw, Download, Upload, Filter } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  totalStock: number;
  channels: {
    shopee: number;
    tokopedia: number;
    tiktok: number;
    lazada: number;
    warehouse: number;
  };
  reorderPoint: number;
  lastRestocked: Date;
  status: "healthy" | "low" | "critical" | "overstocked";
  salesVelocity: number; // units per day
  daysOfStock: number;
}

const mockInventory: InventoryItem[] = [
  {
    id: "1",
    productId: "1",
    name: "Vitamin C Serum",
    sku: "VCS-001",
    totalStock: 245,
    channels: {
      shopee: 73,
      tokopedia: 61,
      tiktok: 49,
      lazada: 37,
      warehouse: 25,
    },
    reorderPoint: 50,
    lastRestocked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    status: "healthy",
    salesVelocity: 8.5,
    daysOfStock: 29,
  },
  {
    id: "2",
    productId: "2",
    name: "Collagen Supplement",
    sku: "COL-001",
    totalStock: 180,
    channels: {
      shopee: 54,
      tokopedia: 45,
      tiktok: 36,
      lazada: 27,
      warehouse: 18,
    },
    reorderPoint: 40,
    lastRestocked: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    status: "healthy",
    salesVelocity: 6.2,
    daysOfStock: 29,
  },
  {
    id: "3",
    productId: "3",
    name: "Omega-3 Capsules",
    sku: "OMG-001",
    totalStock: 45,
    channels: {
      shopee: 15,
      tokopedia: 10,
      tiktok: 8,
      lazada: 7,
      warehouse: 5,
    },
    reorderPoint: 60,
    lastRestocked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: "critical",
    salesVelocity: 4.5,
    daysOfStock: 10,
  },
  {
    id: "4",
    productId: "4",
    name: "Protein Powder",
    sku: "PRO-001",
    totalStock: 150,
    channels: {
      shopee: 45,
      tokopedia: 38,
      tiktok: 30,
      lazada: 22,
      warehouse: 15,
    },
    reorderPoint: 30,
    lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: "healthy",
    salesVelocity: 3.8,
    daysOfStock: 39,
  },
  {
    id: "5",
    productId: "5",
    name: "Probiotic Drink",
    sku: "PRB-001",
    totalStock: 85,
    channels: {
      shopee: 30,
      tokopedia: 20,
      tiktok: 15,
      lazada: 12,
      warehouse: 8,
    },
    reorderPoint: 100,
    lastRestocked: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    status: "low",
    salesVelocity: 12.5,
    daysOfStock: 7,
  },
  {
    id: "6",
    productId: "6",
    name: "Retinol Night Cream",
    sku: "RNC-001",
    totalStock: 380,
    channels: {
      shopee: 100,
      tokopedia: 90,
      tiktok: 80,
      lazada: 70,
      warehouse: 40,
    },
    reorderPoint: 40,
    lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "overstocked",
    salesVelocity: 2.1,
    daysOfStock: 181,
  },
];

const channels = ["shopee", "tokopedia", "tiktok", "lazada", "warehouse"];

export default function InventoryPage() {
  const [inventory] = useState(mockInventory);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showSyncModal, setShowSyncModal] = useState(false);

  const filteredInventory = selectedStatus === "all"
    ? inventory
    : inventory.filter(item => item.status === selectedStatus);

  const criticalCount = inventory.filter(item => item.status === "critical").length;
  const lowCount = inventory.filter(item => item.status === "low").length;
  const overstockedCount = inventory.filter(item => item.status === "overstocked").length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.totalStock * 350000), 0); // Assuming avg price

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-100";
      case "low": return "text-yellow-600 bg-yellow-100";
      case "critical": return "text-red-600 bg-red-100";
      case "overstocked": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, string> = {
      shopee: "🛍️",
      tokopedia: "🟢",
      tiktok: "📱",
      lazada: "🔵",
      warehouse: "📦",
    };
    return icons[channel] || "📦";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Real-time stock tracking across all channels</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline px-4 py-2 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn-outline px-4 py-2 flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            onClick={() => setShowSyncModal(true)}
            className="btn-primary px-4 py-2 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Inventory Value</p>
              <p className="text-2xl font-bold">
                Rp {formatNumber(totalValue / 1000000)}M
              </p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Items</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-xs text-gray-500">Immediate action needed</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowCount}</p>
              <p className="text-xs text-gray-500">Reorder soon</p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overstocked</p>
              <p className="text-2xl font-bold text-blue-600">{overstockedCount}</p>
              <p className="text-xs text-gray-500">Consider promotions</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by status:</span>
        </div>
        <div className="flex space-x-2">
          {["all", "healthy", "low", "critical", "overstocked"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedStatus === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Stock</th>
                {channels.map(channel => (
                  <th key={channel} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {getChannelIcon(channel)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days of Stock</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.salesVelocity} units/day
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">{item.sku}</td>
                  <td className="px-4 py-4 text-center">
                    <p className="font-semibold">{item.totalStock}</p>
                    {item.totalStock <= item.reorderPoint && (
                      <p className="text-xs text-red-600">Below reorder point</p>
                    )}
                  </td>
                  {channels.map(channel => (
                    <td key={channel} className="px-4 py-4 text-center text-sm">
                      {item.channels[channel as keyof typeof item.channels]}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center">
                    <p className={`font-medium ${
                      item.daysOfStock <= 7 ? "text-red-600" :
                      item.daysOfStock <= 14 ? "text-yellow-600" :
                      item.daysOfStock > 90 ? "text-blue-600" :
                      "text-green-600"
                    }`}>
                      {item.daysOfStock} days
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="text-primary hover:underline text-sm">
                      Rebalance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Sync Inventory</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will sync inventory levels across all connected channels. This may take a few moments.
            </p>
            
            <div className="space-y-3 mb-6">
              {channels.map(channel => (
                <label key={channel} className="flex items-center">
                  <input type="checkbox" className="mr-3" defaultChecked />
                  <span className="text-sm">{getChannelIcon(channel)} {channel.charAt(0).toUpperCase() + channel.slice(1)}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSyncModal(false)}
                className="btn-outline px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  // Simulate sync
                  setTimeout(() => alert("Inventory synced successfully!"), 1000);
                }}
                className="btn-primary px-4 py-2"
              >
                Start Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}