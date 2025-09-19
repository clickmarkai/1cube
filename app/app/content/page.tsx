"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import UploadModal from "../../../components/content/UploadModal";
import ContentCard from "../../../components/content/ContentCard";
import PlatformTabs from "../../../components/content/PlatformTabs";
import EmptyState from "../../../components/content/EmptyState";

interface ContentItem {
  id: string;
  title: string;
  caption: string;
  thumbnail: string;
  video_url?: string;
  platform: "tiktok" | "instagram";
  views: number;
  likes: number;
  comments: number;
  shares: number;
  upload_date: Date;
  is_draft: boolean;
}


export default function ContentPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Dummy function to fetch content - will be implemented later
  const fetchContent = async (platform: "tiktok" | "instagram") => {
    // TODO: Implement actual API call
    console.log(`Fetching content for ${platform}`);
    setContent([]);
  };

  useEffect(() => {
    fetchContent(selectedPlatform);
  }, [selectedPlatform]);

  const handleUploadSuccess = () => {
    fetchContent(selectedPlatform);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage your TikTok and Instagram content</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Content
        </button>
      </div>

      {/* Platform Tabs */}
      <PlatformTabs 
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {content.length === 0 ? (
          <EmptyState platform={selectedPlatform} />
        ) : (
          content.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        selectedPlatform={selectedPlatform}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}