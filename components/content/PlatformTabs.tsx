"use client";

interface PlatformTabsProps {
  selectedPlatform: "tiktok" | "instagram";
  onPlatformChange: (platform: "tiktok" | "instagram") => void;
}

export default function PlatformTabs({ selectedPlatform, onPlatformChange }: PlatformTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onPlatformChange("tiktok")}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            selectedPlatform === "tiktok"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          📱 TikTok
        </button>
        <button
          onClick={() => onPlatformChange("instagram")}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            selectedPlatform === "instagram"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          📷 Instagram
        </button>
      </nav>
    </div>
  );
}
