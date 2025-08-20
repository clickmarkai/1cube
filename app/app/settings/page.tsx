"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Store, Users, Globe, Bell, Shield, CreditCard, Key, 
  Check, X, Plus, Settings as SettingsIcon, Save, AlertCircle 
} from "lucide-react";
import { generateChannelAuthLink } from "@/lib/channels";
import { getChannelsByUserId, updateChannelConnectionByName as updateChannelConnectionService } from "@/lib/channels-service";
import { type Channel } from "@/lib/channels";

type TabType = "channels" | "team" | "brand" | "billing" | "security";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  avatar?: string;
  joinedAt: Date;
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabType>("channels");
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Channel Management State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  // Team Management State
  const [teamMembers] = useState<TeamMember[]>([
    { 
      id: session?.user?.id || "1", 
      name: session?.user?.name || "Current User", 
      email: session?.user?.email || "user@1cube.id", 
      role: "owner", 
      joinedAt: new Date('2025-01-17T00:00:00Z') 
    },
    { id: "2", name: "Sarah Marketing", email: "sarah@company.id", role: "admin", joinedAt: new Date('2024-12-18T00:00:00Z') },
    { id: "3", name: "Budi Content", email: "budi@company.id", role: "editor", joinedAt: new Date('2025-01-02T00:00:00Z') },
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

  const fetchChannels = async () => {
    try {
      if (!session?.user?.id) {
        setMessage({ type: 'error', text: 'User not authenticated' });
        setIsLoadingChannels(false);
        return;
      }

      setIsLoadingChannels(true);
      const result = await getChannelsByUserId(session.user.id);
      
      if (result.success && result.data) {
        setChannels(result.data);
      } else {
        console.error('Failed to fetch channels:', result.error);
        setMessage({ type: 'error', text: 'Failed to load channels' });
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setMessage({ type: 'error', text: 'Failed to load channels' });
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const updateChannelConnection = async (channelName: string, connected: boolean) => {
    try {
      if (!session?.user?.id) {
        setMessage({ type: 'error', text: 'User not authenticated' });
        return false;
      }

      const result = await updateChannelConnectionService(
        session.user.id,
        channelName, 
        connected, 
        connected ? new Date() : undefined
      );
      
      if (result.success && result.data) {
        // Always refresh channels to get the updated state
        await fetchChannels();
        setHasChanges(true);
        return true;
      } else {
        console.error('Failed to update channel:', result.error);
        setMessage({ type: 'error', text: 'Failed to update channel connection' });
        return false;
      }
    } catch (error) {
      console.error('Error updating channel:', error);
      setMessage({ type: 'error', text: 'Failed to update channel connection' });
      return false;
    }
  };
  
  useEffect(() => {
    if (session?.user?.id && status === "authenticated") {
      fetchChannels();
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('error_message');
    const success = searchParams.get('success');
    const successMessage = searchParams.get('success_message');

    if (error && errorMessage) {
      setMessage({ type: 'error', text: errorMessage });
    } else if (success && successMessage) {
      setMessage({ type: 'success', text: successMessage });
      if (success === 'Shopee_connected') {
        fetchChannels();
      }
    }

    if (error || success) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('error_message');
      newUrl.searchParams.delete('success');
      newUrl.searchParams.delete('success_message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

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

      {isLoadingChannels ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading channels...</p>
        </div>
      ) : (
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
                  <button 
                    className="btn-outline px-3 py-1 text-sm"
                    onClick={async () => {
                      await updateChannelConnection(channel.name, false);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button 
                  className="btn-primary px-4 py-2"
                  onClick={async () => {  
                    if (channel.name === "Shopee") {
                      const { authLink, state } = generateChannelAuthLink('shopee', {
                        userId: session?.user?.id || ""
                      });
                      
                      document.cookie = `shopee_auth_state=${state}; path=/; max-age=600; secure; samesite=strict`;
                      
                      window.location.href = authLink;
                    } else {
                      await updateChannelConnection(channel.name, true);
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
      )}

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

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access settings.</p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="btn-primary px-4 py-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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

      {/* Success/Error Messages */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 mr-3 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          )}
          <span>{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="ml-auto text-current hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}