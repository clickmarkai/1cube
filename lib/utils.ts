import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", options || {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return revenue / spend;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateCVR(conversions: number, clicks: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}

export function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}

export function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    shopee: "bg-orange-500",
    tokopedia: "bg-green-500",
    lazada: "bg-blue-600",
    tiktok: "bg-black",
    instagram: "bg-pink-500",
    meta: "bg-blue-500",
    bukalapak: "bg-red-500",
    blibli: "bg-blue-700",
    google: "bg-yellow-500",
    whatsapp: "bg-green-600",
  };
  return colors[channel] || "bg-gray-500";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
    draft: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(d, { dateStyle: "medium" });
}