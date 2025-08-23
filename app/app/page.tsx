"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
} from "lucide-react";

// Mock data
const kpiData = {
  revenue: { value: "Rp 2,847,500,000", change: 12.5, trend: "up" },
  roas: { value: "4.2x", change: 8.3, trend: "up" },
  cac: { value: "Rp 125,000", change: -5.2, trend: "down" },
  aov: { value: "Rp 450,000", change: 6.8, trend: "up" },
  ltv: { value: "Rp 1,850,000", change: 15.3, trend: "up" },
};

const revenueData = [
  { date: "Jan 1", revenue: 2100000000, orders: 4200 },
  { date: "Jan 8", revenue: 2250000000, orders: 4500 },
  { date: "Jan 15", revenue: 2400000000, orders: 4800 },
  { date: "Jan 22", revenue: 2600000000, orders: 5200 },
  { date: "Jan 29", revenue: 2847500000, orders: 5695 },
];

const channelData = [
  { name: "shopee", value: 35, revenue: 996625000, color: "#FF6B35" },
  { name: "Tokopedia", value: 28, revenue: 797300000, color: "#42B549" },
  { name: "TikTok Shop", value: 20, revenue: 569500000, color: "#000000" },
  { name: "Lazada", value: 10, revenue: 284750000, color: "#0F146D" },
  { name: "Others", value: 7, revenue: 199325000, color: "#F8B259" },
];

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "Dead Ad Detected",
    message: "Vitamin C Serum campaign showing declining performance",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "success",
    title: "Stock Sync Complete",
    message: "All marketplaces updated with latest inventory",
    time: "4 hours ago",
  },
  {
    id: 3,
    type: "info",
    title: "New Winning Angle",
    message: "Protein Powder 'Morning Routine' angle performing well",
    time: "6 hours ago",
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = React.useState("7d");
  
  console.log('📊 Dashboard page component rendering...');
  
  React.useEffect(() => {
    console.log('📊 Dashboard page mounted and ready');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Revenue"
          value={kpiData.revenue.value}
          change={kpiData.revenue.change}
          trend={kpiData.revenue.trend}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard
          title="ROAS"
          value={kpiData.roas.value}
          change={kpiData.roas.change}
          trend={kpiData.roas.trend}
          icon={<Target className="h-6 w-6" />}
        />
        <KPICard
          title="CAC"
          value={kpiData.cac.value}
          change={kpiData.cac.change}
          trend={kpiData.cac.trend}
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="AOV"
          value={kpiData.aov.value}
          change={kpiData.aov.change}
          trend={kpiData.aov.trend}
          icon={<ShoppingCart className="h-6 w-6" />}
        />
        <KPICard
          title="LTV"
          value={kpiData.ltv.value}
          change={kpiData.ltv.change}
          trend={kpiData.ltv.trend}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Visual Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {revenueData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.date}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(item.revenue / 3000000000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Mix */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Channel Revenue Mix</h3>
          <div className="space-y-4">
            {channelData.map((channel, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: channel.color }}
                  ></div>
                  <span className="text-sm font-medium">{channel.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatCurrency(channel.revenue)}</div>
                  <div className="text-xs text-gray-500">{channel.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string;
  value: string;
  change: number;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-1">
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <div className="p-3 bg-primary-lighter rounded-lg">
          <div className="text-primary">{icon}</div>
        </div>
      </div>
    </div>
  );
}

function Alert({ alert }: { alert: any }) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "info":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      {getAlertIcon(alert.type)}
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
        <p className="text-sm text-gray-600">{alert.message}</p>
        <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
      </div>
    </div>
  );
}