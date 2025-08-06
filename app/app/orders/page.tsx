"use client";

import { useState } from "react";
import { ShoppingCart, Clock, CheckCircle, Truck, AlertCircle, Filter, Download, Search } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface Order {
  id: string;
  orderId: string;
  date: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  channel: string;
  paymentMethod: string;
  trackingNumber?: string;
  notes?: string;
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderId: "ORD-2025-001",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    customer: {
      name: "Siti Nurhaliza",
      email: "siti@email.com",
      phone: "+62 812-3456-7890",
      address: "Jl. Sudirman No. 123, Jakarta Selatan 12190",
    },
    items: [
      { productId: "1", name: "Vitamin C Serum", quantity: 2, price: 350000 },
      { productId: "5", name: "Probiotic Drink", quantity: 1, price: 120000 },
    ],
    subtotal: 820000,
    shipping: 0,
    total: 820000,
    status: "processing",
    channel: "shopee",
    paymentMethod: "ShopeePay",
  },
  {
    id: "2",
    orderId: "ORD-2025-002",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    customer: {
      name: "Budi Santoso",
      email: "budi@email.com",
      phone: "+62 813-4567-8901",
      address: "Jl. Gatot Subroto No. 456, Bandung 40123",
    },
    items: [
      { productId: "2", name: "Collagen Supplement", quantity: 1, price: 450000 },
      { productId: "3", name: "Omega-3 Capsules", quantity: 1, price: 380000 },
    ],
    subtotal: 830000,
    shipping: 15000,
    total: 845000,
    status: "shipped",
    channel: "tokopedia",
    paymentMethod: "GoPay",
    trackingNumber: "JNE123456789",
  },
  {
    id: "3",
    orderId: "ORD-2025-003",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    customer: {
      name: "Maya Putri",
      email: "maya@email.com",
      phone: "+62 814-5678-9012",
      address: "Jl. Diponegoro No. 789, Surabaya 60123",
    },
    items: [
      { productId: "4", name: "Protein Powder", quantity: 1, price: 580000 },
    ],
    subtotal: 580000,
    shipping: 20000,
    total: 600000,
    status: "delivered",
    channel: "tiktok",
    paymentMethod: "COD",
  },
  {
    id: "4",
    orderId: "ORD-2025-004",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
    customer: {
      name: "Ahmad Rahman",
      email: "ahmad@email.com",
      phone: "+62 815-6789-0123",
      address: "Jl. Ahmad Yani No. 321, Medan 20123",
    },
    items: [
      { productId: "6", name: "Retinol Night Cream", quantity: 1, price: 420000 },
      { productId: "10", name: "Face Mask Set", quantity: 2, price: 250000 },
    ],
    subtotal: 920000,
    shipping: 0,
    total: 920000,
    status: "pending",
    channel: "lazada",
    paymentMethod: "Credit Card",
  },
  {
    id: "5",
    orderId: "ORD-2025-005",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    customer: {
      name: "Dewi Lestari",
      email: "dewi@email.com",
      phone: "+62 816-7890-1234",
      address: "Jl. Pemuda No. 567, Semarang 50123",
    },
    items: [
      { productId: "7", name: "Green Tea Extract", quantity: 2, price: 280000 },
      { productId: "9", name: "Organic Honey", quantity: 1, price: 150000 },
    ],
    subtotal: 710000,
    shipping: 12000,
    total: 722000,
    status: "cancelled",
    channel: "shopee",
    paymentMethod: "Bank Transfer",
    notes: "Customer cancelled - found cheaper elsewhere",
  },
];

const statuses = [
  { id: "all", name: "All Orders", color: "bg-gray-100" },
  { id: "pending", name: "Pending", color: "bg-yellow-100", icon: Clock },
  { id: "processing", name: "Processing", color: "bg-blue-100", icon: ShoppingCart },
  { id: "shipped", name: "Shipped", color: "bg-purple-100", icon: Truck },
  { id: "delivered", name: "Delivered", color: "bg-green-100", icon: CheckCircle },
  { id: "cancelled", name: "Cancelled", color: "bg-red-100", icon: AlertCircle },
];

export default function OrdersPage() {
  const [orders] = useState(mockOrders);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const todayRevenue = orders
    .filter(o => o.date.toDateString() === new Date().toDateString() && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const processingOrders = orders.filter(o => o.status === "processing").length;
  const completedOrders = orders.filter(o => o.status === "delivered").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "processing": return "text-blue-600 bg-blue-100";
      case "shipped": return "text-purple-600 bg-purple-100";
      case "delivered": return "text-green-600 bg-green-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, string> = {
      shopee: "🛍️",
      tokopedia: "🟢",
      tiktok: "📱",
      lazada: "🔵",
    };
    return icons[channel] || "🛒";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Track and manage orders from all channels</p>
        </div>
        <button className="btn-outline px-4 py-2 flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export Orders
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{processingOrders}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex space-x-2">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center ${
                selectedStatus === status.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {status.icon && <status.icon className="h-4 w-4 mr-2" />}
              {status.name}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="input pl-10 pr-4 py-2"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{order.orderId}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.date)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.customer.phone}</p>
                      <p className="text-xs text-gray-500">{order.customer.address}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-bold">{formatCurrency(order.total)}</p>
                      {order.shipping > 0 && (
                        <p className="text-xs text-gray-500">
                          Shipping: {formatCurrency(order.shipping)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getChannelIcon(order.channel)}</span>
                      <div>
                        <p className="text-sm font-medium capitalize">{order.channel}</p>
                        <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.trackingNumber && (
                      <p className="text-xs text-gray-500 mt-1">
                        {order.trackingNumber}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:underline text-sm">
                        View
                      </button>
                      {order.status === "pending" && (
                        <button className="text-blue-600 hover:underline text-sm">
                          Process
                        </button>
                      )}
                      {order.status === "processing" && (
                        <button className="text-purple-600 hover:underline text-sm">
                          Ship
                        </button>
                      )}
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