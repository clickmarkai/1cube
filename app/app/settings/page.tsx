"use client";

import { useState } from "react";
import { 
  Store, Users, Globe, Bell, Shield, CreditCard, Key, 
  Check, X, Plus, Settings as SettingsIcon, Save 
} from "lucide-react";
import { generateShopeeAuthLink } from "@/app/api/settings/auth";

type TabType = "channels" | "team" | "brand" | "billing" | "security";

interface Channel {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: Date;
  credentials?: {
    apiKey?: string;
    apiSecret?: string;
    shopId?: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  avatar?: string;
  joinedAt: Date;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("channels");
  const [hasChanges, setHasChanges] = useState(false);

  // Channel Management State
  const [channels, setChannels] = useState<Channel[]>([
    { id: "shopee", name: "Shopee", icon: "🛍️", connected: false, lastSync: new Date(Date.now() - 3600000) },
    { id: "tokopedia", name: "Tokopedia", icon: "🟢", connected: true, lastSync: new Date(Date.now() - 7200000) },
    { id: "tiktok", name: "TikTok Shop", icon: "📱", connected: false },
    { id: "lazada", name: "Lazada", icon: "🔵", connected: false },
    { id: "bukalapak", name: "Bukalapak", icon: "🔴", connected: false },
    { id: "blibli", name: "Blibli", icon: "🟦", connected: false },
  ]);

  // Team Management State
  const [teamMembers] = useState<TeamMember[]>([
    { id: "1", name: "Demo User", email: "demo@1cube.id", role: "owner", joinedAt: new Date() },
    { id: "2", name: "Sarah Marketing", email: "sarah@company.id", role: "admin", joinedAt: new Date(Date.now() - 86400000 * 30) },
    { id: "3", name: "Budi Content", email: "budi@company.id", role: "editor", joinedAt: new Date(Date.now() - 86400000 * 15) },
  ]);

  // Brand Settings State
  const [brandSettings, setBrandSettings] = useState({
    companyName: "Wellness Brand Co",
    brandVoice: "friendly",
    defaultLanguage: "id",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    autoTranslate: true,
    complianceMode: "strict",
  });

  const tabs = [
    { id: "channels" as TabType, name: "Channels", icon: Store },
    { id: "team" as TabType, name: "Team", icon: Users },
    { id: "brand" as TabType, name: "Brand", icon: Globe },
    { id: "billing" as TabType, name: "Billing", icon: CreditCard },
    { id: "security" as TabType, name: "Security", icon: Shield },
  ];

  const handleSave = () => {
    // Simulate saving
    setTimeout(() => {
      setHasChanges(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  const renderChannelsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Marketplace Integrations</h3>
        <p className="text-sm text-gray-600">Connect your marketplace accounts to sync products, orders, and inventory</p>
      </div>

      <div className="grid gap-4">
        {channels.map((channel) => (
          <div key={channel.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{channel.icon}</span>
                <div>
                  <h4 className="font-semibold">{channel.name}</h4>
                  {channel.connected && channel.lastSync && (
                    <p className="text-sm text-gray-500">
                      Last synced: {new Date(channel.lastSync).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>
              
              {channel.connected ? (
                <div className="flex items-center space-x-2">
                  <span className="flex items-center text-sm text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    Connected
                  </span>
                  <button className="btn-outline px-3 py-1 text-sm">
                    Configure
                  </button>
                </div>
              ) : (
                <button 
                  className="btn-primary px-4 py-2"
                  onClick={() => {
                    if (channel.id === "shopee") {
                      window.location.href = generateShopeeAuthLink();
                    } else {
                      const updatedChannels = channels.map(ch => 
                        ch.id === channel.id ? { ...ch, connected: true, lastSync: new Date() } : ch
                      );
                      setChannels(updatedChannels);
                      setHasChanges(true);
                    }
                  }}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-primary-lighter">
        <h4 className="font-semibold mb-2">🔗 Additional Integrations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>WhatsApp Business</strong>
            <p className="text-xs text-gray-600">Customer support</p>
          </div>
          <div>
            <strong>Instagram Shopping</strong>
            <p className="text-xs text-gray-600">Social commerce</p>
          </div>
          <div>
            <strong>Google Merchant</strong>
            <p className="text-xs text-gray-600">Shopping ads</p>
          </div>
          <div>
            <strong>Klaviyo</strong>
            <p className="text-xs text-gray-600">Email marketing</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold mb-1">Team Members</h3>
          <p className="text-sm text-gray-600">Manage your team's access and permissions</p>
        </div>
        <button className="btn-primary px-4 py-2 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </button>
      </div>

      <div className="space-y-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">{member.name}</h4>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select 
                  className="input"
                  value={member.role}
                  onChange={() => setHasChanges(true)}
                  disabled={member.role === "owner"}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                {member.role !== "owner" && (
                  <button className="text-red-600 hover:text-red-700">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-gray-50">
        <h4 className="font-semibold mb-3">Role Permissions</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Admin:</strong> Full access except billing
          </div>
          <div>
            <strong>Editor:</strong> Create and edit content, campaigns
          </div>
          <div>
            <strong>Viewer:</strong> View-only access to all data
          </div>
          <div>
            <strong>Owner:</strong> Full access including billing
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrandTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Brand Settings</h3>
        <p className="text-sm text-gray-600">Configure your brand voice and localization preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label block mb-2">Company Name</label>
          <input
            type="text"
            className="input w-full"
            value={brandSettings.companyName}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, companyName: e.target.value });
              setHasChanges(true);
            }}
          />
        </div>

        <div>
          <label className="label block mb-2">Brand Voice</label>
          <select
            className="input w-full"
            value={brandSettings.brandVoice}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, brandVoice: e.target.value });
              setHasChanges(true);
            }}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="casual">Casual</option>
            <option value="energetic">Energetic</option>
          </select>
        </div>

        <div>
          <label className="label block mb-2">Default Language</label>
          <select
            className="input w-full"
            value={brandSettings.defaultLanguage}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, defaultLanguage: e.target.value });
              setHasChanges(true);
            }}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="label block mb-2">Timezone</label>
          <select
            className="input w-full"
            value={brandSettings.timezone}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, timezone: e.target.value });
              setHasChanges(true);
            }}
          >
            <option value="Asia/Jakarta">Jakarta (WIB)</option>
            <option value="Asia/Makassar">Makassar (WITA)</option>
            <option value="Asia/Jayapura">Jayapura (WIT)</option>
          </select>
        </div>

        <div>
          <label className="label block mb-2">Currency</label>
          <select
            className="input w-full"
            value={brandSettings.currency}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, currency: e.target.value });
              setHasChanges(true);
            }}
          >
            <option value="IDR">Indonesian Rupiah (IDR)</option>
            <option value="USD">US Dollar (USD)</option>
          </select>
        </div>

        <div>
          <label className="label block mb-2">Compliance Mode</label>
          <select
            className="input w-full"
            value={brandSettings.complianceMode}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, complianceMode: e.target.value });
              setHasChanges(true);
            }}
          >
            <option value="strict">Strict (Recommended)</option>
            <option value="moderate">Moderate</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={brandSettings.autoTranslate}
            onChange={(e) => {
              setBrandSettings({ ...brandSettings, autoTranslate: e.target.checked });
              setHasChanges(true);
            }}
            className="mr-2"
          />
          <span className="text-sm">Auto-translate content between Indonesian and English</span>
        </label>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Billing & Subscription</h3>
        <p className="text-sm text-gray-600">Manage your subscription and payment methods</p>
      </div>

      <div className="card bg-primary-lighter">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-semibold text-lg">Pro Plan</h4>
            <p className="text-sm text-gray-600">Rp 2,500,000 / month</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Active</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            Unlimited products & campaigns
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            All marketplace integrations
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            AI content generation (50,000 credits/month)
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            Priority support
          </div>
        </div>
        <button className="btn-outline w-full mt-4">Upgrade Plan</button>
      </div>

      <div className="card">
        <h4 className="font-semibold mb-4">Payment Method</h4>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/25</p>
            </div>
          </div>
          <button className="text-primary hover:underline text-sm">Update</button>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold mb-4">Usage This Month</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>AI Credits</span>
              <span>32,450 / 50,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "65%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>API Calls</span>
              <span>125,000 / 200,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "62.5%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Security Settings</h3>
        <p className="text-sm text-gray-600">Manage your account security and API access</p>
      </div>

      <div className="card">
        <h4 className="font-semibold mb-4">Two-Factor Authentication</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <button className="btn-primary px-4 py-2">Enable 2FA</button>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold mb-4">API Keys</h4>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Production API Key</span>
              <button className="text-red-600 hover:text-red-700 text-sm">Revoke</button>
            </div>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded">sk_prod_••••••••••••••••</code>
            <p className="text-xs text-gray-500 mt-2">Created on Jan 1, 2025</p>
          </div>
          <button className="btn-outline w-full flex items-center justify-center">
            <Key className="h-4 w-4 mr-2" />
            Generate New API Key
          </button>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold mb-4">Recent Activity</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Login from Chrome on Windows</span>
            <span className="text-gray-500">2 hours ago</span>
          </div>
          <div className="flex justify-between">
            <span>API Key used from 103.123.xxx.xxx</span>
            <span className="text-gray-500">5 hours ago</span>
          </div>
          <div className="flex justify-between">
            <span>Password changed</span>
            <span className="text-gray-500">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "channels": return renderChannelsTab();
      case "team": return renderTeamTab();
      case "brand": return renderBrandTab();
      case "billing": return renderBillingTab();
      case "security": return renderSecurityTab();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        {hasChanges && (
          <button onClick={handleSave} className="btn-primary px-4 py-2 flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>{renderContent()}</div>
    </div>
  );
}