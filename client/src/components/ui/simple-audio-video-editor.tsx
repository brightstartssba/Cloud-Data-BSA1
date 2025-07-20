import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Save,
  X,
  Music,
  Video
} from "lucide-react";
import type { File } from "@shared/schema";

interface SimpleAudioVideoEditorProps {
  file: File;
  onSave?: (editedData: Blob) => void;
  onClose: () => void;
}

export default function SimpleAudioVideoEditor({ file, onSave, onClose }: SimpleAudioVideoEditorProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;
    
    const time = value[0];
    media.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    const media = mediaRef.current;
    if (media) {
      media.volume = vol / 100;
    }
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skipBackward = () => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.currentTime = Math.max(currentTime - 10, 0);
  };

  const skipForward = () => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.currentTime = Math.min(currentTime + 10, duration);
  };

  const changePlaybackSpeed = (speed: number) => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadFile = () => {
    // Simply download the original file
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white border-b border-white/10">
        <h2 className="text-lg font-semibold">
          {isAudio ? 'Audio' : 'Video'} Player - {file.originalName}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadFile}
            className="text-white/80 hover:text-white"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Media Area */}
        <div className="flex-1 flex flex-col">
          {/* Media Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            {isVideo ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={`/api/files/${file.id}/download`}
                className="max-w-full max-h-full rounded border border-white/20"
                controls={false}
              />
            ) : (
              <div className="text-center">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-6xl mb-6 mx-auto">
                  🎵
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{file.originalName}</h3>
                <p className="text-white/60">{formatTime(duration)} duration</p>
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={`/api/files/${file.id}/download`}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Media Controls */}
          <div className="bg-black/50 p-4 border-t border-white/10">
            {/* Timeline */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white text-sm mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration || 100}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4">
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
                size="lg"
                onClick={togglePlayPause}
                className="text-white/80 hover:text-white bg-white/10 rounded-full p-3"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
                className="text-white/80 hover:text-white"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2 mx-4">
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

              <div className="flex items-center space-x-2">
                <span className="text-white text-xs">Speed:</span>
                {[0.5, 1, 1.5, 2].map(speed => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "default" : "ghost"}
                    size="sm"
                    onClick={() => changePlaybackSpeed(speed)}
                    className="text-xs px-2 py-1"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-black/50 border-l border-white/10 p-4 overflow-y-auto">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center">
                {isAudio ? <Music className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                {isAudio ? 'Audio' : 'Video'} Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-white/60 text-xs">Duration</Label>
                <p className="text-white text-sm">{formatTime(duration)}</p>
              </div>
              
              <div>
                <Label className="text-white/60 text-xs">Current Time</Label>
                <p className="text-white text-sm">{formatTime(currentTime)}</p>
              </div>

              <div>
                <Label className="text-white/60 text-xs">Playback Speed</Label>
                <p className="text-white text-sm">{playbackSpeed}x</p>
              </div>

              <div>
                <Label className="text-white/60 text-xs">Volume</Label>
                <p className="text-white text-sm">{volume}%</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-white/60 text-xs mb-2">
                  Advanced editing features like trimming, effects, and export will be available in future updates.
                </p>
                <Button
                  onClick={downloadFile}
                  variant="outline"
                  size="sm"
                  className="w-full text-white border-white/20"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Original
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}