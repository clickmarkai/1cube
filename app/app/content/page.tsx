"use client";

import { useState, useEffect } from "react";
import { Upload, Play, Heart, MessageCircle, Share, MoreHorizontal, X, FileVideo, Image } from "lucide-react";

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

interface UploadFormData {
  is_draft: boolean;
  title: string;
  caption: string;
  disable_duet: boolean;
  disable_stitch: boolean;
  disable_comment: boolean;
  video_cover_timestamp: number;
  brand_content: boolean;
  brand_organic: boolean;
  is_private: boolean;
  channel: string;
  files: File[];
}

export default function ContentPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    is_draft: false,
    title: "",
    caption: "",
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
    video_cover_timestamp: 0,
    brand_content: false,
    brand_organic: false,
    is_private: false,
    channel: "",
    files: [],
  });

  // Dummy function to fetch content - will be implemented later
  const fetchContent = async (platform: "tiktok" | "instagram") => {
    // TODO: Implement actual API call
    console.log(`Fetching content for ${platform}`);
    setContent([]);
  };

  useEffect(() => {
    fetchContent(selectedPlatform);
  }, [selectedPlatform]);

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      
      // Add files
      uploadForm.files.forEach(file => {
        formData.append('files', file);
      });

      // Add form fields
      formData.append('is_draft', uploadForm.is_draft.toString());
      formData.append('title', uploadForm.title);
      formData.append('caption', uploadForm.caption);
      formData.append('disable_duet', uploadForm.disable_duet.toString());
      formData.append('disable_stitch', uploadForm.disable_stitch.toString());
      formData.append('disable_comment', uploadForm.disable_comment.toString());
      formData.append('video_cover_timestamp', uploadForm.video_cover_timestamp.toString());
      formData.append('brand_content', uploadForm.brand_content.toString());
      formData.append('brand_organic', uploadForm.brand_organic.toString());
      formData.append('is_private', uploadForm.is_private.toString());
      formData.append('channel', selectedPlatform);

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('Content uploaded successfully!');
        setIsUploadModalOpen(false);
        // Reset form
        setUploadForm({
          is_draft: false,
          title: "",
          caption: "",
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
          video_cover_timestamp: 0,
          brand_content: false,
          brand_organic: false,
          is_private: false,
          channel: "",
          files: [],
        });
        // Refresh content
        fetchContent(selectedPlatform);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: Network error');
    } finally {
      setIsUploading(false);
    }
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedPlatform("tiktok")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedPlatform === "tiktok"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            📱 TikTok
          </button>
          <button
            onClick={() => setSelectedPlatform("instagram")}
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {content.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-12">
              <FileVideo className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No content found for {selectedPlatform}</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload your first content to get started
              </p>
            </div>
          </div>
        ) : (
          content.map((item) => (
            <div key={item.id} className="card p-0 overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] bg-gray-100">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-8 w-8 text-white" />
                </div>
                {item.is_draft && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Draft
                  </div>
                )}
              </div>

              {/* Content Info */}
              <div className="p-4">
                <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.caption}</p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {item.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {item.comments.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share className="h-3 w-3" />
                      {item.shares.toLocaleString()}
                    </span>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  {item.upload_date.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Upload Content to {selectedPlatform}</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="label block mb-2">Media Files</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="video/*,image/*"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setUploadForm({ ...uploadForm, files });
                    }}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileVideo className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">Video or image files</p>
                  </label>
                  {uploadForm.files.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-green-600">
                        {uploadForm.files.length} file(s) selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="label block mb-2">Title</label>
                <input
                  type="text"
                  className="input w-full"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Enter content title"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="label block mb-2">Caption</label>
                <textarea
                  className="input w-full h-24"
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                  placeholder="Enter caption..."
                />
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Save as Draft */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_draft"
                    checked={uploadForm.is_draft}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_draft: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_draft" className="ml-2 text-sm">Save as draft</label>
                </div>

                {/* Private */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={uploadForm.is_private}
                    onChange={(e) => setUploadForm({ ...uploadForm, is_private: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_private" className="ml-2 text-sm">Private</label>
                </div>

                {/* Brand Content */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="brand_content"
                    checked={uploadForm.brand_content}
                    onChange={(e) => setUploadForm({ ...uploadForm, brand_content: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="brand_content" className="ml-2 text-sm">Brand content</label>
                </div>

                {/* Brand Organic */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="brand_organic"
                    checked={uploadForm.brand_organic}
                    onChange={(e) => setUploadForm({ ...uploadForm, brand_organic: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="brand_organic" className="ml-2 text-sm">Brand organic</label>
                </div>

                {selectedPlatform === "tiktok" && (
                  <>
                    {/* Disable Duet */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="disable_duet"
                        checked={uploadForm.disable_duet}
                        onChange={(e) => setUploadForm({ ...uploadForm, disable_duet: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="disable_duet" className="ml-2 text-sm">Disable duet</label>
                    </div>

                    {/* Disable Stitch */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="disable_stitch"
                        checked={uploadForm.disable_stitch}
                        onChange={(e) => setUploadForm({ ...uploadForm, disable_stitch: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="disable_stitch" className="ml-2 text-sm">Disable stitch</label>
                    </div>
                  </>
                )}

                {/* Disable Comments */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="disable_comment"
                    checked={uploadForm.disable_comment}
                    onChange={(e) => setUploadForm({ ...uploadForm, disable_comment: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="disable_comment" className="ml-2 text-sm">Disable comments</label>
                </div>
              </div>

              {/* Video Cover Timestamp */}
              {selectedPlatform === "tiktok" && (
                <div>
                  <label className="label block mb-2">Video Cover Timestamp (ms)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={uploadForm.video_cover_timestamp}
                    onChange={(e) => setUploadForm({ ...uploadForm, video_cover_timestamp: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 btn-primary py-2 flex items-center justify-center"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}