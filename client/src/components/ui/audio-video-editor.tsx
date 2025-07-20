import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  Download,
  Save,
  Undo,
  Redo,
  Music,
  Mic
} from "lucide-react";
import type { File } from "@shared/schema";

interface AudioVideoEditorProps {
  file: File;
  onSave?: (editedData: Blob) => void;
  onClose: () => void;
}

interface EditSegment {
  start: number;
  end: number;
  volume?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

export default function AudioVideoEditor({ file, onSave, onClose }: AudioVideoEditorProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  
  // Editing states
  const [segments, setSegments] = useState<EditSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<EditSegment | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [editHistory, setEditHistory] = useState<EditSegment[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');

  useEffect(() => {
    loadMedia();
  }, [file]);

  const loadMedia = async () => {
    try {
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading media:", error);
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const media = mediaRef.current;
    if (!media) return;
    
    setCurrentTime(media.currentTime);
    setDuration(media.duration || 0);
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

  const setTrimPoints = () => {
    setTrimStart(currentTime);
    setTrimEnd(Math.min(currentTime + 30, duration)); // Default 30-second segment
  };

  const addSegment = () => {
    if (trimEnd > trimStart) {
      const newSegment: EditSegment = {
        start: trimStart,
        end: trimEnd,
        volume: 100,
      };
      
      const newSegments = [...segments, newSegment];
      setSegments(newSegments);
      addToHistory(newSegments);
    }
  };

  const removeSegment = (segment: EditSegment) => {
    const newSegments = segments.filter(s => s !== segment);
    setSegments(newSegments);
    addToHistory(newSegments);
  };

  const addToHistory = (newSegments: EditSegment[]) => {
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push([...newSegments]);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setSegments([...editHistory[prevIndex]]);
      setHistoryIndex(prevIndex);
    }
  };

  const redo = () => {
    if (historyIndex < editHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setSegments([...editHistory[nextIndex]]);
      setHistoryIndex(nextIndex);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const exportMedia = () => {
    // In a real implementation, you would use Web Audio API 
    // or send the segments to a server for processing
    alert("Export functionality would process segments and create final media file");
    
    if (onSave) {
      // Create a dummy blob for now
      const blob = new Blob([], { type: file.mimeType });
      onSave(blob);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            {isAudio ? <Music className="w-6 h-6" /> : "🎬"}
          </div>
          <p>Loading {isAudio ? 'audio' : 'video'} editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white border-b border-white/10">
        <h2 className="text-lg font-semibold">
          Edit {isAudio ? 'Audio' : 'Video'} - {file.originalName}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="text-white/80 hover:text-white"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= editHistory.length - 1}
            className="text-white/80 hover:text-white"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportMedia}
            className="text-white/80 hover:text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            Export
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

      <div className="flex-1 flex">
        {/* Main Media Area */}
        <div className="flex-1 flex flex-col">
          {/* Media Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            {isVideo ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={`/api/files/${file.id}/download`}
                className="max-w-full max-h-full rounded"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => setDuration((mediaRef.current as HTMLVideoElement).duration)}
              />
            ) : (
              <div className="text-center">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-6xl mb-6 mx-auto">
                  🎵
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{file.originalName}</h3>
                <audio
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={`/api/files/${file.id}/download`}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={() => setDuration((mediaRef.current as HTMLAudioElement).duration)}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-black/50 p-4 border-t border-white/10">
            <div className="mb-4">
              <div className="flex items-center justify-between text-white text-sm mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Segments Display */}
            {segments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white text-sm mb-2">Segments:</h4>
                <div className="flex flex-wrap gap-2">
                  {segments.map((segment, index) => (
                    <div
                      key={index}
                      className="bg-blue-500/30 text-white text-xs px-2 py-1 rounded flex items-center space-x-2"
                    >
                      <span>{formatTime(segment.start)} - {formatTime(segment.end)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSegment(segment)}
                        className="h-4 w-4 p-0 text-white/60 hover:text-white"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Controls */}
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
                className="text-white/80 hover:text-white"
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
                    className="text-xs"
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
          <Tabs defaultValue="trim" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="trim" className="text-xs">Trim</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
            </TabsList>

            <TabsContent value="trim" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Trim {isAudio ? 'Audio' : 'Video'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-xs">Start Time</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        type="number"
                        value={trimStart.toFixed(1)}
                        onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                        className="bg-white/10 border-white/20 text-white text-xs"
                        step="0.1"
                        min="0"
                        max={duration}
                      />
                      <Button
                        size="sm"
                        onClick={() => setTrimStart(currentTime)}
                        className="text-xs"
                      >
                        Set
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white text-xs">End Time</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        type="number"
                        value={trimEnd.toFixed(1)}
                        onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)}
                        className="bg-white/10 border-white/20 text-white text-xs"
                        step="0.1"
                        min="0"
                        max={duration}
                      />
                      <Button
                        size="sm"
                        onClick={() => setTrimEnd(currentTime)}
                        className="text-xs"
                      >
                        Set
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={setTrimPoints}
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20 text-xs"
                    >
                      <Scissors className="w-3 h-3 mr-1" />
                      Quick Trim
                    </Button>
                    <Button
                      onClick={addSegment}
                      variant="default"
                      size="sm"
                      className="text-xs"
                      disabled={trimEnd <= trimStart}
                    >
                      Add Segment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Audio Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/60 text-xs">
                    Advanced effects like noise reduction, echo, reverb, and EQ would be implemented here.
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-white border-white/20 text-xs"
                    disabled
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Noise Reduction (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}