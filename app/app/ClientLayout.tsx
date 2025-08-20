"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { InstantNav } from "../../components/ui/InstantNavigation";
import { usePrefetchRoutes } from "../../hooks/usePrefetchRoutes";
import { PerformanceMonitor } from "../../components/PerformanceMonitor";
import { NavigationDebugger } from "../../components/NavigationDebugger";
import { RouterDebugger } from "../../components/RouterDebugger";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Brain,
  Package,
  Mail,
  MessageCircle,
  Box,
  List,
  ShoppingCart,
  BarChart3,
  Settings,
  Palette,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Bell,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Campaigns", href: "/app/campaigns", icon: Megaphone },
  { name: "Content", href: "/app/content", icon: FileText },
  { name: "Intelligence", href: "/app/intelligence", icon: Brain },
  { name: "Bundles", href: "/app/bundles", icon: Package },
  { name: "Email", href: "/app/email", icon: Mail },
  { name: "Chatbot", href: "/app/chatbot", icon: MessageCircle },
  { name: "Inventory", href: "/app/inventory", icon: Box },
  { name: "Listings", href: "/app/listings", icon: List },
  { name: "Orders", href: "/app/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { name: "Creatives Lab", href: "/app/creatives-lab", icon: Palette },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  
  console.log('🏗️ ClientLayout rendering for pathname:', pathname);
  console.log('🔐 Session status:', status, 'Session:', session);
  
  // Prefetch all routes for instant navigation
  usePrefetchRoutes();

  // Guard: redirect to login if no session (with delay to avoid loops)
  useEffect(() => {
    if (status === "unauthenticated") {
      // Small delay to prevent immediate redirect loops
      const timer = setTimeout(() => {
        router.replace("/auth/login");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Show loading while session is being checked
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PerformanceMonitor />
      <NavigationDebugger />
      <RouterDebugger />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-2xl font-bold text-primary">1Cube</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <nav className="px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <InstantNav
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 mb-1 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </InstantNav>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{session?.user?.name ?? "User"}</p>
              <p className="text-xs text-gray-500">{session?.user?.email ?? ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-400" />
            </button>

            <div className="flex-1 px-4">
              <p className="text-sm text-gray-500">
                Welcome back, {session?.user?.name ?? "User"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <InstantNav
                        href="/app/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </InstantNav>
                      <button
                        onClick={() => {
                          // Use NextAuth signOut
                          signOut({ callbackUrl: "/auth/login" });
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="inline-block h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutContent>{children}</ClientLayoutContent>;
}