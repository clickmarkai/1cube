"use client";

import { Play, Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";

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

interface ContentCardProps {
  item: ContentItem;
}

export default function ContentCard({ item }: ContentCardProps) {
  return (
    <div className="card p-0 overflow-hidden">
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
  );
}
