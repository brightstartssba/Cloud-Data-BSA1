import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize, 
  Info,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Edit3,
  Download
} from "lucide-react";
import type { File } from "@shared/schema";

interface EnhancedFileViewerProps {
  file: File;
  onEdit?: () => void;
  onClose: () => void;
}

export default function EnhancedFileViewer({ file, onEdit, onClose }: EnhancedFileViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPdf = file.mimeType.includes('pdf');
  const isDocument = file.mimeType.includes('document') || file.mimeType.includes('text');

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.key === ' ' && (isVideo || isAudio)) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isFullscreen, isVideo, isAudio]);

  const formatFileSize = (bytes: number | string): string => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    if (videoRef.current) videoRef.current.volume = vol / 100;
    if (audioRef.current) audioRef.current.volume = vol / 100;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
    if (audioRef.current) audioRef.current.muted = !isMuted;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (videoRef.current) videoRef.current.currentTime = time;
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const skipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm ${isFullscreen ? 'p-0' : 'p-4'}`}
    >
      <div className="h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 bg-black/50 text-white">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold truncate">{file.originalName}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-white/80 hover:text-white"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-white/80 hover:text-white"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
              className="text-white/80 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white"
            >
              <Maximize className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* File Info Panel */}
        {showInfo && (
          <Card className="mx-4 mb-4 bg-black/70 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Size:</span> {formatFileSize(file.size)}</p>
                  <p><span className="font-medium">Type:</span> {file.mimeType}</p>
                </div>
                <div>
                  <p><span className="font-medium">Created:</span> {new Date(file.createdAt!).toLocaleString()}</p>
                  <p><span className="font-medium">Modified:</span> {new Date(file.updatedAt!).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Controls */}
        {isImage && (
          <div className="flex items-center justify-center space-x-2 p-4 bg-black/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white/80 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-white text-sm min-w-16 text-center">{zoom}%</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white/80 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-white/20 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotateLeft}
              className="text-white/80 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotateRight}
              className="text-white/80 hover:text-white"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Media Controls for Video/Audio */}
        {(isVideo || isAudio) && (
          <div className="flex items-center space-x-4 p-4 bg-black/50 text-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="text-white/80 hover:text-white"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white/80 hover:text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="text-white/80 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="flex-1 flex items-center space-x-3">
              <span className="text-sm">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration}
                step={1}
                className="flex-1"
              />
              <span className="text-sm">{formatTime(duration)}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white/80 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          {isImage && (
            <img
              ref={imageRef}
              src={`/api/files/${file.id}/download`}
              alt={file.originalName}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                cursor: zoom > 100 ? 'move' : 'default'
              }}
            />
          )}

          {isVideo && (
            <video
              ref={videoRef}
              src={`/api/files/${file.id}/download`}
              className="max-w-full max-h-full"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls={false}
            />
          )}

          {isAudio && (
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">
                🎵
              </div>
              <h3 className="text-xl font-semibold mb-2">{file.originalName}</h3>
              <p className="text-white/60">{formatFileSize(file.size)}</p>
              <audio
                ref={audioRef}
                src={`/api/files/${file.id}/download`}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={`/api/files/${file.id}/download`}
              className="w-full h-full border-0 rounded-lg"
              title={file.originalName}
            />
          )}

          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">
                📄
              </div>
              <h3 className="text-xl font-semibold mb-2">{file.originalName}</h3>
              <p className="text-white/60 mb-4">{formatFileSize(file.size)}</p>
              <Button 
                onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
                className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download to View
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}