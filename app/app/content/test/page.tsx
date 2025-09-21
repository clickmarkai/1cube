"use client";

import { useState } from "react";
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Users, Heart, MessageCircle, Share2 } from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  cover_image_url: string;
  create_time?: number;
  duration?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  video_description?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    videos: VideoData[];
    totalCount: number;
    pageCount: number;
    platform: string;
    note?: string;
    userId: string;
    timestamp: string;
    videoSample?: VideoData[];
  };
  debug?: {
    hasVideos: boolean;
    firstVideoId?: string;
    lastVideoId?: string;
    uniqueVideoIds: number;
  };
}

export default function TikTokVideosTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [requestType, setRequestType] = useState<'GET' | 'POST'>('GET');

  const testGetVideos = async () => {
    setIsLoading(true);
    setResponse(null);
    setRequestType('GET');

    try {
      const res = await fetch('/api/content/videos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPostVideos = async () => {
    setIsLoading(true);
    setResponse(null);
    setRequestType('POST');

    try {
      const res = await fetch('/api/content/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">TikTok Videos API Test</h1>
        <p className="text-gray-600 mt-1">Test the getAllVideos functionality</p>
      </div>

      {/* Test Controls */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex gap-4">
          <button
            onClick={testGetVideos}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && requestType === 'GET' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Test GET Request
          </button>
          
          <button
            onClick={testPostVideos}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && requestType === 'POST' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Test POST Request (with debug)
          </button>
        </div>
      </div>

      {/* Response Status */}
      {response && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            {response.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h2 className="text-xl font-semibold">
              {response.success ? 'Success' : 'Error'}
            </h2>
          </div>

          {response.success ? (
            <div className="space-y-4">
              <p className="text-green-600 font-medium">{response.message}</p>
              
              {response.data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{response.data.totalCount}</div>
                    <div className="text-sm text-gray-600">Total Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{response.data.pageCount}</div>
                    <div className="text-sm text-gray-600">Pages Fetched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{response.data.platform}</div>
                    <div className="text-sm text-gray-600">Platform</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {response.debug?.uniqueVideoIds || response.data.videos.length}
                    </div>
                    <div className="text-sm text-gray-600">Unique Videos</div>
                  </div>
                </div>
              )}

              {response.data?.note && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">{response.data.note}</p>
                </div>
              )}

              {response.debug && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Debug Information</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Has Videos: {response.debug.hasVideos ? 'Yes' : 'No'}</p>
                    <p>First Video ID: {response.debug.firstVideoId || 'N/A'}</p>
                    <p>Last Video ID: {response.debug.lastVideoId || 'N/A'}</p>
                    <p>Unique Video Count: {response.debug.uniqueVideoIds}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">{response.error}</p>
          )}
        </div>
      )}

      {/* Videos Display */}
      {response?.success && response.data?.videos && response.data.videos.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">
            Videos ({response.data.videos.length} total)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {response.data.videos.slice(0, 12).map((video) => (
              <div key={video.id} className="card p-0 overflow-hidden">
                <div className="aspect-[9/16] bg-gray-200 relative">
                  <img
                    src={video.cover_image_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy="0.35em" fill="%236b7280">No Image</text></svg>';
                    }}
                  />
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{video.title}</h3>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    <p>ID: {video.id}</p>
                    <p>Created: {formatDate(video.create_time)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{formatNumber(video.view_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{formatNumber(video.like_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{formatNumber(video.comment_count)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      <span>{formatNumber(video.share_count)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {response.data.videos.length > 12 && (
            <div className="mt-4 text-center text-gray-500">
              Showing first 12 of {response.data.videos.length} videos
            </div>
          )}
        </div>
      )}

      {/* Raw Response (for debugging) */}
      {response && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Response</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
