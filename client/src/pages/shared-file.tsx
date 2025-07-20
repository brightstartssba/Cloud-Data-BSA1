import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { File, SharedFile } from "@shared/schema";

export default function SharedFilePage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [shareData, setShareData] = useState<{share: SharedFile, file: File} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Extract token from URL path /share/:token
  const token = location.split('/share/')[1];

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setIsLoading(false);
      return;
    }

    const fetchSharedFile = async () => {
      try {
        const response = await fetch(`/api/shares/token/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Shared file not found or link has expired");
          } else if (response.status === 410) {
            setError("This share link has expired");
          } else {
            setError("Failed to load shared file");
          }
          return;
        }

        const data = await response.json();
        setShareData(data);
      } catch (error) {
        console.error("Error fetching shared file:", error);
        setError("Failed to load shared file");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedFile();
  }, [token]);

  const handleDownload = () => {
    if (shareData) {
      window.open(`/api/files/${shareData.file.id}/download`, '_blank');
    }
  };

  const formatFileSize = (bytes: number | string): string => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📄';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <p className="text-neutral-600">Loading shared file...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😕</span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Oops!</h2>
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { share, file } = shareData;
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                <span className="text-xl">🦊</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AnimalDrive
              </h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
          
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* File Info */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-2xl">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-1">
                      {file.originalName}
                    </h2>
                    <p className="text-neutral-600">
                      {formatFileSize(file.size)} • Shared {formatDate(share.createdAt!)}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Access level: <span className="font-medium">{share.accessLevel}</span>
                      {share.expiresAt && (
                        <span> • Expires: {formatDate(share.expiresAt)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* File Preview */}
              <div className="bg-neutral-50 rounded-2xl p-8 text-center">
                {isImage && (
                  <img
                    src={`/api/files/${file.id}/download`}
                    alt={file.originalName}
                    className="max-w-full h-auto rounded-xl shadow-lg mx-auto"
                    style={{ maxHeight: '500px' }}
                  />
                )}
                
                {isVideo && (
                  <video
                    controls
                    className="max-w-full h-auto rounded-xl shadow-lg mx-auto"
                    style={{ maxHeight: '500px' }}
                  >
                    <source src={`/api/files/${file.id}/download`} type={file.mimeType} />
                    Your browser does not support the video tag.
                  </video>
                )}

                {isAudio && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-4xl">
                      🎵
                    </div>
                    <audio controls className="w-full max-w-md">
                      <source src={`/api/files/${file.id}/download`} type={file.mimeType} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {!isImage && !isVideo && !isAudio && (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-full flex items-center justify-center text-4xl">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                        {file.originalName}
                      </h3>
                      <p className="text-neutral-600 mb-4">
                        Click download to view this file
                      </p>
                      <Button 
                        onClick={handleDownload}
                        className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}