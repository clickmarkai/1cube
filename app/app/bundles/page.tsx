"use client";

import { useState } from "react";
import { Package, Plus, TrendingUp, DollarSign, ShoppingCart, Sparkles, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Bundle {
  id: string;
  name: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  originalPrice: number;
  bundlePrice: number;
  discount: number;
  margin: number;
  projectedAOV: number;
  rationale: string;
  habitPairing: string;
  channels: string[];
  status: "active" | "draft" | "paused";
  sales: number;
  revenue: number;
}

const mockBundles: Bundle[] = [
  {
    id: "1",
    name: "Morning Glow Bundle",
    products: [
      { id: "1", name: "Vitamin C Serum", price: 350000, quantity: 1 },
      { id: "5", name: "Probiotic Drink", price: 120000, quantity: 30 },
    ],
    originalPrice: 3950000,
    bundlePrice: 3160000,
    discount: 20,
    margin: 58,
    projectedAOV: 3160000,
    rationale: "Perfect morning routine combination - Vitamin C for skin glow + Probiotics for gut health. Indonesian customers love routine bundles.",
    habitPairing: "Take probiotic drink first thing in the morning, apply Vitamin C serum after morning cleanse",
    channels: ["shopee", "tokopedia", "tiktok"],
    status: "active",
    sales: 234,
    revenue: 739440000,
  },
  {
    id: "2",
    name: "Complete Wellness Package",
    products: [
      { id: "2", name: "Collagen Supplement", price: 450000, quantity: 1 },
      { id: "3", name: "Omega-3 Capsules", price: 380000, quantity: 1 },
      { id: "7", name: "Green Tea Extract", price: 280000, quantity: 1 },
    ],
    originalPrice: 1110000,
    bundlePrice: 888000,
    discount: 20,
    margin: 55,
    projectedAOV: 888000,
    rationale: "Comprehensive wellness solution targeting multiple health aspects. Bundle pricing encourages higher cart value.",
    habitPairing: "Morning: green tea extract, Lunch: omega-3, Evening: collagen before bed",
    channels: ["shopee", "tokopedia", "lazada"],
    status: "active",
    sales: 156,
    revenue: 138528000,
  },
  {
    id: "3",
    name: "Skincare Essentials",
    products: [
      { id: "1", name: "Vitamin C Serum", price: 350000, quantity: 1 },
      { id: "6", name: "Retinol Night Cream", price: 420000, quantity: 1 },
      { id: "10", name: "Face Mask Set", price: 250000, quantity: 1 },
    ],
    originalPrice: 1020000,
    bundlePrice: 816000,
    discount: 20,
    margin: 60,
    projectedAOV: 816000,
    rationale: "Complete day & night skincare routine. High margin products with proven demand.",
    habitPairing: "Morning: Vitamin C, Evening: Retinol, Weekly: Face masks (2x per week)",
    channels: ["shopee", "instagram", "tiktok"],
    status: "draft",
    sales: 0,
    revenue: 0,
  },
];

export default function BundlesPage() {
  const [bundles, setBundles] = useState(mockBundles);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const availableProducts = [
    { id: "1", name: "Vitamin C Serum", price: 350000, cost: 150000 },
    { id: "2", name: "Collagen Supplement", price: 450000, cost: 200000 },
    { id: "3", name: "Omega-3 Capsules", price: 380000, cost: 180000 },
    { id: "4", name: "Protein Powder", price: 580000, cost: 250000 },
    { id: "5", name: "Probiotic Drink", price: 120000, cost: 50000 },
    { id: "6", name: "Retinol Night Cream", price: 420000, cost: 180000 },
    { id: "7", name: "Green Tea Extract", price: 280000, cost: 120000 },
    { id: "8", name: "Yoga Mat Premium", price: 650000, cost: 300000 },
    { id: "9", name: "Organic Honey", price: 150000, cost: 70000 },
    { id: "10", name: "Face Mask Set", price: 250000, cost: 100000 },
  ];

  const handleGenerateBundles = async () => {
    if (selectedProducts.length < 2) {
      alert("Please select at least 2 products");
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setShowCreateModal(false);
      // In real implementation, this would add new suggested bundles
      alert("AI Bundle suggestions generated! Check your bundle list.");
    }, 2000);
  };

  const calculateBundleMetrics = (productIds: string[]) => {
    const products = productIds.map(id => availableProducts.find(p => p.id === id)!);
    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
    const totalCost = products.reduce((sum, p) => sum + p.cost, 0);
    const discountedPrice = totalPrice * 0.8; // 20% discount
    const margin = ((discountedPrice - totalCost) / discountedPrice) * 100;

    return {
      originalPrice: totalPrice,
      discountedPrice,
      margin: Math.round(margin),
      savings: totalPrice - discountedPrice,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bundle Manager</h1>
          <p className="text-gray-600 mt-1">AI-powered bundles for margin and AOV optimization</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2 flex items-center"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate AI Bundles
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Bundles</p>
              <p className="text-2xl font-bold">
                {bundles.filter(b => b.status === "active").length}
              </p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(bundles.reduce((sum, b) => sum + b.revenue, 0))}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Bundle AOV</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  bundles.filter(b => b.sales > 0).reduce((sum, b) => sum + b.bundlePrice, 0) / 
                  bundles.filter(b => b.sales > 0).length || 0
                )}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Margin</p>
              <p className="text-2xl font-bold">
                {Math.round(bundles.reduce((sum, b) => sum + b.margin, 0) / bundles.length)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Bundle List */}
      <div className="space-y-4">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-semibold">{bundle.name}</h3>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    bundle.status === "active" ? "bg-green-100 text-green-700" :
                    bundle.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {bundle.status}
                  </span>
                  <div className="flex -space-x-1">
                    {bundle.channels.map((channel) => (
                      <span
                        key={channel}
                        className={`h-6 w-6 rounded-full ${
                          channel === "shopee" ? "bg-orange-500" :
                          channel === "tokopedia" ? "bg-green-500" :
                          channel === "tiktok" ? "bg-black" :
                          channel === "instagram" ? "bg-pink-500" :
                          "bg-blue-600"
                        } border-2 border-white flex items-center justify-center`}
                        title={channel}
                      >
                        <span className="text-white text-xs font-bold">
                          {channel.charAt(0).toUpperCase()}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Products:</p>
                  <div className="flex flex-wrap gap-2">
                    {bundle.products.map((product) => (
                      <span
                        key={product.id}
                        className="text-xs bg-gray-100 px-2 py-1 rounded-lg"
                      >
                        {product.name} {product.quantity > 1 && `x${product.quantity}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Original Price</p>
                    <p className="font-medium line-through text-gray-400">
                      {formatCurrency(bundle.originalPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bundle Price</p>
                    <p className="font-bold text-primary">
                      {formatCurrency(bundle.bundlePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Discount</p>
                    <p className="font-medium text-green-600">{bundle.discount}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Margin</p>
                    <p className="font-medium">{bundle.margin}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="font-medium">{bundle.sales} units</p>
                  </div>
                </div>

                {/* Rationale */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium mb-1">AI Rationale:</p>
                  <p className="text-sm text-gray-600">{bundle.rationale}</p>
                </div>

                {/* Habit Pairing */}
                <div className="bg-primary-lighter rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Habit Pairing:</p>
                  <p className="text-sm text-gray-700">{bundle.habitPairing}</p>
                </div>
              </div>

              <div className="ml-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Generate AI Bundles</h2>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Select Products</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableProducts.map((product) => (
                  <label
                    key={product.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProducts.includes(product.id)
                        ? "border-primary bg-primary-lighter"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                    />
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-gray-500">
                        Margin: {Math.round(((product.price - product.cost) / product.price) * 100)}%
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {selectedProducts.length >= 2 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Bundle Preview</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const metrics = calculateBundleMetrics(selectedProducts);
                    return (
                      <>
                        <p>Original: {formatCurrency(metrics.originalPrice)}</p>
                        <p className="text-primary font-bold">
                          Bundle: {formatCurrency(metrics.discountedPrice)} (Save {formatCurrency(metrics.savings)})
                        </p>
                        <p>Projected Margin: {metrics.margin}%</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedProducts([]);
                }}
                className="btn-outline px-6 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateBundles}
                disabled={selectedProducts.length < 2 || isGenerating}
                className="btn-primary px-6 py-2 flex items-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Bundles
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}