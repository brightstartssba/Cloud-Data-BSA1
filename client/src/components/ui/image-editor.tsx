import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical,
  Crop,
  Palette,
  Type,
  Download,
  Undo,
  Redo,
  Save
} from "lucide-react";
import type { File } from "@shared/schema";

interface ImageEditorProps {
  file: File;
  onSave?: (editedImageData: string) => void;
  onClose: () => void;
}

interface EditHistory {
  imageData: string;
  operations: string[];
}

export default function ImageEditor({ file, onSave, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImageData, setOriginalImageData] = useState<string>("");
  const [currentImageData, setCurrentImageData] = useState<string>("");
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit states
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState<{x: number, y: number} | null>(null);
  const [cropEnd, setCropEnd] = useState<{x: number, y: number} | null>(null);
  
  // Text state
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(24);

  useEffect(() => {
    loadImage();
  }, [file]);

  const loadImage = async () => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');
        setOriginalImageData(imageData);
        setCurrentImageData(imageData);
        addToHistory(imageData, ['Original']);
        setIsLoading(false);
      };
      img.src = `/api/files/${file.id}/download`;
    } catch (error) {
      console.error("Error loading image:", error);
      setIsLoading(false);
    }
  };

  const addToHistory = useCallback((imageData: string, operations: string[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ imageData, operations });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCurrentImageData(history[prevIndex].imageData);
      applyImageToCanvas(history[prevIndex].imageData);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentImageData(history[nextIndex].imageData);
      applyImageToCanvas(history[nextIndex].imageData);
    }
  };

  const applyImageToCanvas = useCallback((imageData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.onerror = () => {
      console.error('Failed to load image for canvas');
    };
    img.src = imageData;
  }, []);

  const applyFilters = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Clear and save context
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply transformations
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.translate(-centerX, -centerY);
      
      // Apply filters
      const filters = [];
      if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
      if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
      if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
      if (hue !== 0) filters.push(`hue-rotate(${hue}deg)`);
      
      ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      
      const newImageData = canvas.toDataURL('image/png');
      setCurrentImageData(newImageData);
    };
    img.onerror = () => {
      console.error('Failed to apply filters to image');
    };
    img.src = originalImageData;
  }, [originalImageData, rotation, flipH, flipV, brightness, contrast, saturation, hue]);

  const handleRotate = useCallback((degrees: number) => {
    setRotation(prev => prev + degrees);
    setTimeout(() => applyFilters(), 100);
  }, [applyFilters]);

  const handleFlip = useCallback((horizontal: boolean) => {
    if (horizontal) {
      setFlipH(prev => !prev);
    } else {
      setFlipV(prev => !prev);
    }
    setTimeout(() => applyFilters(), 100);
  }, [applyFilters, flipH, flipV]);

  const handleFilterChange = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const applyCrop = () => {
    if (!cropStart || !cropEnd) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const width = Math.abs(cropEnd.x - cropStart.x);
      const height = Math.abs(cropEnd.y - cropStart.y);
      
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      const newImageData = canvas.toDataURL('image/png');
      setCurrentImageData(newImageData);
      addToHistory(newImageData, ['Crop']);
      setCropMode(false);
      setCropStart(null);
      setCropEnd(null);
    };
    img.src = currentImageData;
  };

  const addText = () => {
    if (!textInput.trim()) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(textInput, canvas.width / 2, canvas.height / 2);
    
    const newImageData = canvas.toDataURL('image/png');
    setCurrentImageData(newImageData);
    addToHistory(newImageData, ['Add Text']);
    setTextMode(false);
    setTextInput("");
  };

  const saveImage = () => {
    if (onSave) {
      onSave(currentImageData);
    } else {
      // Download edited image
      const link = document.createElement('a');
      link.download = `edited_${file.originalName}`;
      link.href = currentImageData;
      link.click();
    }
  };

  const resetAll = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setHue(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCurrentImageData(originalImageData);
    applyImageToCanvas(originalImageData);
    addToHistory(originalImageData, ['Reset']);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            🎨
          </div>
          <p>Loading image editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white border-b border-white/10">
        <h2 className="text-lg font-semibold">Edit Image - {file.originalName}</h2>
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
            disabled={historyIndex >= history.length - 1}
            className="text-white/80 hover:text-white"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={saveImage}
            className="text-white/80 hover:text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
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
        {/* Sidebar */}
        <div className="w-80 bg-black/50 border-r border-white/10 p-4 overflow-y-auto">
          <Tabs defaultValue="adjustments" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="adjustments" className="text-xs">Adjust</TabsTrigger>
              <TabsTrigger value="transform" className="text-xs">Transform</TabsTrigger>
              <TabsTrigger value="crop" className="text-xs">Crop</TabsTrigger>
              <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="adjustments" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Color Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-xs">Brightness</Label>
                    <Slider
                      value={[brightness]}
                      onValueChange={(value) => {
                        setBrightness(value[0]);
                        setTimeout(handleFilterChange, 100);
                      }}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-white/60 text-xs">{brightness}%</span>
                  </div>

                  <div>
                    <Label className="text-white text-xs">Contrast</Label>
                    <Slider
                      value={[contrast]}
                      onValueChange={(value) => {
                        setContrast(value[0]);
                        setTimeout(handleFilterChange, 100);
                      }}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-white/60 text-xs">{contrast}%</span>
                  </div>

                  <div>
                    <Label className="text-white text-xs">Saturation</Label>
                    <Slider
                      value={[saturation]}
                      onValueChange={(value) => {
                        setSaturation(value[0]);
                        setTimeout(handleFilterChange, 100);
                      }}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-white/60 text-xs">{saturation}%</span>
                  </div>

                  <div>
                    <Label className="text-white text-xs">Hue</Label>
                    <Slider
                      value={[hue]}
                      onValueChange={(value) => {
                        setHue(value[0]);
                        setTimeout(handleFilterChange, 100);
                      }}
                      min={-180}
                      max={180}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-white/60 text-xs">{hue}°</span>
                  </div>

                  <Button
                    onClick={resetAll}
                    variant="outline"
                    size="sm"
                    className="w-full text-white border-white/20"
                  >
                    Reset All
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transform" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Transform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleRotate(-90)}
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Rotate Left
                    </Button>
                    <Button
                      onClick={() => handleRotate(90)}
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20"
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      Rotate Right
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleFlip(true)}
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20"
                    >
                      <FlipHorizontal className="w-4 h-4 mr-1" />
                      Flip H
                    </Button>
                    <Button
                      onClick={() => handleFlip(false)}
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20"
                    >
                      <FlipVertical className="w-4 h-4 mr-1" />
                      Flip V
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crop" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Crop Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setCropMode(!cropMode)}
                    variant={cropMode ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    <Crop className="w-4 h-4 mr-1" />
                    {cropMode ? "Exit Crop" : "Start Crop"}
                  </Button>
                  
                  {cropMode && (
                    <div className="text-xs text-white/60">
                      Click and drag on the image to select crop area
                    </div>
                  )}
                  
                  {cropStart && cropEnd && (
                    <Button
                      onClick={applyCrop}
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      Apply Crop
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Add Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-xs">Text</Label>
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white text-xs">Font Size</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(value) => setFontSize(value[0])}
                      min={12}
                      max={72}
                      step={2}
                      className="mt-2"
                    />
                    <span className="text-white/60 text-xs">{fontSize}px</span>
                  </div>

                  <div>
                    <Label className="text-white text-xs">Color</Label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="mt-2 w-full h-10"
                    />
                  </div>

                  <Button
                    onClick={addText}
                    variant="default"
                    size="sm"
                    className="w-full"
                    disabled={!textInput.trim()}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Add Text
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full border border-white/20 rounded"
            style={{ cursor: cropMode ? 'crosshair' : 'default' }}
            onClick={(e) => {
              if (!cropMode) return;
              
              const canvas = canvasRef.current;
              if (!canvas) return;
              
              const rect = canvas.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              if (!cropStart) {
                setCropStart({ x, y });
              } else {
                setCropEnd({ x, y });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}