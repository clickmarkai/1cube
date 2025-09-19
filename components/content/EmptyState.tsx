"use client";

import { FileVideo } from "lucide-react";

interface EmptyStateProps {
  platform: "tiktok" | "instagram";
}

export default function EmptyState({ platform }: EmptyStateProps) {
  return (
    <div className="col-span-full">
      <div className="text-center py-12">
        <FileVideo className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No content found for {platform}</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload your first content to get started
        </p>
      </div>
    </div>
  );
}
