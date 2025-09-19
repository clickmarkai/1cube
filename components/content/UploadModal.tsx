"use client";

import { useState } from "react";
import { X, FileVideo } from "lucide-react";

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

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlatform: "tiktok" | "instagram";
  onUploadSuccess: () => void;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  selectedPlatform, 
  onUploadSuccess 
}: UploadModalProps) {
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
        onClose();
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
        onUploadSuccess();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Upload Content to {selectedPlatform}</h2>
          <button
            onClick={onClose}
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
              onClick={onClose}
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
  );
}
