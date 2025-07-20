import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical,
  Download,
  Save,
  X
} from "lucide-react";
import type { File } from "@shared/schema";

interface SimpleImageEditorProps {
  file: File;
  onSave?: (editedImageData: string) => void;
  onClose: () => void;
}

export default function SimpleImageEditor({ file, onSave, onClose }: SimpleImageEditorProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const imageStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    transition: 'all 0.3s ease',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
  };

  const handleRotate = (degrees: number) => {
    setRotation(prev => prev + degrees);
  };

  const handleFlip = (horizontal: boolean) => {
    if (horizontal) {
      setFlipH(!flipH);
    } else {
      setFlipV(!flipV);
    }
  };

  const resetAll = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const saveImage = () => {
    // Create a canvas to capture the edited image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save context state
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
      if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
      if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
      if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
      
      ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Restore context
      ctx.restore();
      
      // Get edited image data
      const editedImageData = canvas.toDataURL('image/png');
      
      if (onSave) {
        onSave(editedImageData);
      } else {
        // Download the edited image
        const link = document.createElement('a');
        link.download = `edited_${file.originalName}`;
        link.href = editedImageData;
        link.click();
      }
    };
    img.src = `/api/files/${file.id}/download`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 text-white border-b border-white/10">
        <h2 className="text-lg font-semibold">Edit Image - {file.originalName}</h2>
        <div className="flex items-center space-x-2">
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
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Sidebar */}
        <div className="w-full sm:w-80 bg-black/50 border-t sm:border-t-0 sm:border-r border-white/10 p-4 overflow-y-auto order-2 sm:order-1">
          <div className="space-y-6">
            {/* Color Adjustments */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">Color Adjustments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white text-xs">Brightness</Label>
                  <Slider
                    value={[brightness]}
                    onValueChange={(value) => setBrightness(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-white/60 text-xs">{brightness}%</span>
                </div>

                <div>
                  <Label className="text-white text-xs">Contrast</Label>
                  <Slider
                    value={[contrast]}
                    onValueChange={(value) => setContrast(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-white/60 text-xs">{contrast}%</span>
                </div>

                <div>
                  <Label className="text-white text-xs">Saturation</Label>
                  <Slider
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                  <span className="text-white/60 text-xs">{saturation}%</span>
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

            {/* Transform */}
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
                    Rotate L
                  </Button>
                  <Button
                    onClick={() => handleRotate(90)}
                    variant="outline"
                    size="sm"
                    className="text-white border-white/20"
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    Rotate R
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
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden order-1 sm:order-2 min-h-64 sm:min-h-0">
          <img
            src={`/api/files/${file.id}/download`}
            alt={file.originalName}
            style={imageStyle}
            className="border border-white/20 rounded"
          />
        </div>
      </div>
    </div>
  );
}