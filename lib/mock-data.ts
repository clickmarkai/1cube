// Mock data for demonstration purposes

export const mockProducts = [
  { id: "1", name: "Vitamin C Serum", price: 350000, cost: 150000, stock: 245, category: "skincare" },
  { id: "2", name: "Collagen Supplement", price: 450000, cost: 200000, stock: 180, category: "supplements" },
  { id: "3", name: "Omega-3 Capsules", price: 380000, cost: 180000, stock: 320, category: "supplements" },
  { id: "4", name: "Protein Powder", price: 580000, cost: 250000, stock: 150, category: "fitness" },
  { id: "5", name: "Probiotic Drink", price: 120000, cost: 50000, stock: 500, category: "healthy-food" },
  { id: "6", name: "Retinol Night Cream", price: 420000, cost: 180000, stock: 95, category: "skincare" },
  { id: "7", name: "Green Tea Extract", price: 280000, cost: 120000, stock: 200, category: "supplements" },
  { id: "8", name: "Yoga Mat Premium", price: 650000, cost: 300000, stock: 80, category: "fitness" },
  { id: "9", name: "Organic Honey", price: 150000, cost: 70000, stock: 350, category: "healthy-food" },
  { id: "10", name: "Face Mask Set", price: 250000, cost: 100000, stock: 420, category: "skincare" },
];

export const mockOrders = [
  {
    id: "ORD-001",
    date: new Date(Date.now() - 3600000),
    customer: "Siti Nurhaliza",
    items: [
      { productId: "1", quantity: 2, price: 350000 },
      { productId: "5", quantity: 1, price: 120000 }
    ],
    total: 820000,
    status: "completed",
    channel: "shopee"
  },
  {
    id: "ORD-002",
    date: new Date(Date.now() - 7200000),
    customer: "Budi Santoso",
    items: [
      { productId: "2", quantity: 1, price: 450000 },
      { productId: "3", quantity: 1, price: 380000 }
    ],
    total: 830000,
    status: "processing",
    channel: "tokopedia"
  },
  {
    id: "ORD-003",
    date: new Date(Date.now() - 10800000),
    customer: "Maya Putri",
    items: [
      { productId: "4", quantity: 1, price: 580000 }
    ],
    total: 580000,
    status: "completed",
    channel: "tiktok"
  },
  {
    id: "ORD-004",
    date: new Date(Date.now() - 14400000),
    customer: "Ahmad Rahman",
    items: [
      { productId: "6", quantity: 1, price: 420000 },
      { productId: "10", quantity: 2, price: 250000 }
    ],
    total: 920000,
    status: "shipped",
    channel: "lazada"
  },
  {
    id: "ORD-005",
    date: new Date(Date.now() - 18000000),
    customer: "Dewi Lestari",
    items: [
      { productId: "7", quantity: 2, price: 280000 },
      { productId: "9", quantity: 1, price: 150000 }
    ],
    total: 710000,
    status: "completed",
    channel: "shopee"
  },
];

export const mockCampaigns = [
  {
    id: "1",
    name: "Wellness Bundle Q1 2025",
    status: "active",
    channels: ["shopee", "tokopedia", "meta"],
    budget: 50000000,
    spent: 32500000,
    roas: 4.2,
    impressions: 2500000,
    clicks: 125000,
    conversions: 2890,
    autoOptimize: true,
    experiments: 12,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    name: "Morning Routine Campaign",
    status: "active",
    channels: ["tiktok", "instagram"],
    budget: 30000000,
    spent: 18750000,
    roas: 5.1,
    impressions: 1800000,
    clicks: 95000,
    conversions: 1850,
    autoOptimize: true,
    experiments: 8,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    name: "Ramadan Special 2025",
    status: "paused",
    channels: ["shopee", "tokopedia", "lazada"],
    budget: 75000000,
    spent: 12500000,
    roas: 3.8,
    impressions: 950000,
    clicks: 42000,
    conversions: 780,
    autoOptimize: false,
    experiments: 5,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    name: "Skincare Transformation",
    status: "active",
    channels: ["instagram", "meta"],
    budget: 25000000,
    spent: 22000000,
    roas: 4.5,
    impressions: 1200000,
    clicks: 68000,
    conversions: 1450,
    autoOptimize: true,
    experiments: 10,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    name: "Flash Sale 12.12",
    status: "completed",
    channels: ["shopee", "lazada", "tokopedia"],
    budget: 100000000,
    spent: 98500000,
    roas: 6.2,
    impressions: 5500000,
    clicks: 380000,
    conversions: 8200,
    autoOptimize: true,
    experiments: 15,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
];

export const mockInventory = mockProducts.map(product => ({
  ...product,
  channels: {
    shopee: Math.floor(product.stock * 0.3),
    tokopedia: Math.floor(product.stock * 0.25),
    tiktok: Math.floor(product.stock * 0.2),
    lazada: Math.floor(product.stock * 0.15),
    warehouse: Math.floor(product.stock * 0.1),
  },
  reorderPoint: Math.floor(product.stock * 0.2),
  lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
}));

export const mockEmailFlows = [
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
  },
];

export const mockChatbotIntents = [
  {
    id: "1",
    intent: "product_inquiry",
    examples: ["What products do you have?", "Show me skincare", "Do you sell vitamins?"],
    response: "We offer a wide range of wellness products including skincare, supplements, and healthy foods. What category interests you?",
    usage: 1250,
  },
  {
    id: "2",
    intent: "order_status",
    examples: ["Where is my order?", "Track my package", "Order status"],
    response: "I can help you track your order. Please provide your order number or email address.",
    usage: 890,
  },
  {
    id: "3",
    intent: "product_recommendation",
    examples: ["What do you recommend?", "Best product for skin", "Suggest supplements"],
    response: "I'd be happy to recommend products! Could you tell me more about your wellness goals?",
    usage: 650,
  },
  {
    id: "4",
    intent: "pricing",
    examples: ["How much?", "Price list", "Any discounts?"],
    response: "Our prices vary by product. We often have bundle deals and promotions! Would you like to see our current offers?",
    usage: 520,
  },
];

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("id-ID").format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};