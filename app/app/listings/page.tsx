"use client";

import { useState } from "react";
import { List, CheckCircle, AlertCircle, Upload, RefreshCw, Filter, Edit, Copy, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Listing {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  channels: Array<{
    channel: string;
    status: "active" | "draft" | "inactive" | "error";
    price: number;
    views: number;
    orders: number;
    lastUpdated: Date;
    url?: string;
  }>;
  images: number;
  hasVariants: boolean;
  syncStatus: "synced" | "pending" | "error";
}

const mockListings: Listing[] = [
  {
    id: "1",
    productId: "1",
    productName: "Vitamin C Serum",
    sku: "VCS-001",
    channels: [
      {
        channel: "shopee",
        status: "active",
        price: 350000,
        views: 12500,
        orders: 450,
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
        url: "https://shopee.co.id/product/123456",
      },
      {
        channel: "tokopedia",
        status: "active",
        price: 355000,
        views: 8900,
        orders: 320,
        lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
        url: "https://tokopedia.com/1cube/vitamin-c-serum",
      },
      {
        channel: "tiktok",
        status: "active",
        price: 340000,
        views: 15600,
        orders: 520,
        lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
        url: "https://shop.tiktok.com/@1cube/product/123",
      },
      {
        channel: "lazada",
        status: "draft",
        price: 350000,
        views: 0,
        orders: 0,
        lastUpdated: new Date(),
      },
    ],
    images: 5,
    hasVariants: false,
    syncStatus: "synced",
  },
  {
    id: "2",
    productId: "2",
    productName: "Collagen Supplement",
    sku: "COL-001",
    channels: [
      {
        channel: "shopee",
        status: "active",
        price: 450000,
        views: 9800,
        orders: 280,
        lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        channel: "tokopedia",
        status: "active",
        price: 455000,
        views: 7200,
        orders: 210,
        lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        channel: "tiktok",
        status: "error",
        price: 440000,
        views: 0,
        orders: 0,
        lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ],
    images: 4,
    hasVariants: true,
    syncStatus: "error",
  },
  {
    id: "3",
    productId: "3",
    productName: "Omega-3 Capsules",
    sku: "OMG-001",
    channels: [
      {
        channel: "shopee",
        status: "active",
        price: 380000,
        views: 6500,
        orders: 180,
        lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        channel: "tokopedia",
        status: "active",
        price: 385000,
        views: 5200,
        orders: 150,
        lastUpdated: new Date(Date.now() - 7 * 60 * 60 * 1000),
      },
      {
        channel: "lazada",
        status: "inactive",
        price: 380000,
        views: 3200,
        orders: 95,
        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ],
    images: 3,
    hasVariants: false,
    syncStatus: "pending",
  },
];

const channels = [
  { id: "shopee", name: "Shopee", icon: "🛍️", color: "bg-orange-500" },
  { id: "tokopedia", name: "Tokopedia", icon: "🟢", color: "bg-green-500" },
  { id: "tiktok", name: "TikTok Shop", icon: "📱", color: "bg-black" },
  { id: "lazada", name: "Lazada", icon: "🔵", color: "bg-blue-600" },
  { id: "bukalapak", name: "Bukalapak", icon: "🔴", color: "bg-red-500" },
  { id: "blibli", name: "Blibli", icon: "🟦", color: "bg-blue-700" },
];

export default function ListingsPage() {
  const [listings] = useState(mockListings);
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  const activeListingsCount = listings.reduce((count, listing) => {
    return count + listing.channels.filter(ch => ch.status === "active").length;
  }, 0);

  const errorListingsCount = listings.reduce((count, listing) => {
    return count + listing.channels.filter(ch => ch.status === "error").length;
  }, 0);

  const totalViews = listings.reduce((sum, listing) => {
    return sum + listing.channels.reduce((chSum, ch) => chSum + ch.views, 0);
  }, 0);

  const totalOrders = listings.reduce((sum, listing) => {
    return sum + listing.channels.reduce((chSum, ch) => chSum + ch.orders, 0);
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Listings</h1>
          <p className="text-gray-600 mt-1">Manage your products across all marketplaces</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBulkEditModal(true)}
            className="btn-outline px-4 py-2"
          >
            Bulk Edit
          </button>
          <button className="btn-primary px-4 py-2 flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold">{activeListingsCount}</p>
            </div>
            <List className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Error Listings</p>
              <p className="text-2xl font-bold text-red-600">{errorListingsCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold">{(totalViews / 1000).toFixed(1)}K</p>
            </div>
            <Eye className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Channel Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by channel:</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedChannel("all")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedChannel === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            All Channels
          </button>
          {channels.slice(0, 4).map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center ${
                selectedChannel === channel.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <span className="mr-1">{channel.icon}</span>
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {listings.map((listing) => (
          <div key={listing.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold">{listing.productName}</h3>
                  <span className="text-sm text-gray-500">SKU: {listing.sku}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getSyncStatusColor(listing.syncStatus)}`}>
                    {listing.syncStatus}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span>{listing.images} images</span>
                  {listing.hasVariants && <span>Has variants</span>}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Copy className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Channel Listings */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {listing.channels
                .filter(ch => selectedChannel === "all" || ch.channel === selectedChannel)
                .map((channelListing) => {
                  const channel = channels.find(c => c.id === channelListing.channel);
                  return (
                    <div
                      key={channelListing.channel}
                      className={`p-4 rounded-lg border ${
                        channelListing.status === "error" ? "border-red-200 bg-red-50" :
                        channelListing.status === "inactive" ? "border-yellow-200 bg-yellow-50" :
                        channelListing.status === "draft" ? "border-gray-200 bg-gray-50" :
                        "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{channel?.icon}</span>
                          <span className="font-medium text-sm">{channel?.name}</span>
                        </div>
                        {getStatusIcon(channelListing.status)}
                      </div>

                      <p className="text-lg font-bold text-primary mb-1">
                        {formatCurrency(channelListing.price)}
                      </p>

                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Views</span>
                          <span className="font-medium">{channelListing.views.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orders</span>
                          <span className="font-medium">{channelListing.orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Updated</span>
                          <span className="font-medium">
                            {formatDate(channelListing.lastUpdated, { timeStyle: "short" })}
                          </span>
                        </div>
                      </div>

                      {channelListing.url && channelListing.status === "active" && (
                        <a
                          href={channelListing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                          View listing →
                        </a>
                      )}

                      {channelListing.status === "error" && (
                        <p className="text-xs text-red-600 mt-2">
                          Sync failed: Missing required fields
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Bulk Edit Listings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label block mb-2">Select Products</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {listings.map((listing) => (
                    <label key={listing.id} className="flex items-center">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-sm">{listing.productName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label block mb-2">Action</label>
                <select className="input w-full">
                  <option>Update Prices</option>
                  <option>Sync Inventory</option>
                  <option>Update Images</option>
                  <option>Change Status</option>
                </select>
              </div>

              <div>
                <label className="label block mb-2">Apply to Channels</label>
                <div className="flex flex-wrap gap-2">
                  {channels.map((channel) => (
                    <label key={channel.id} className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">{channel.icon} {channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="btn-outline px-4 py-2"
              >
                Cancel
              </button>
              <button className="btn-primary px-4 py-2">
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}