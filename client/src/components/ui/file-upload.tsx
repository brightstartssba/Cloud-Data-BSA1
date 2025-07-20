import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";

interface FileUploadProps {
  folderId: number | null;
  onFileUploaded: () => void;
}

export default function FileUpload({ folderId, onFileUploaded }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      if (folderId) {
        formData.append('folderId', folderId.toString());
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      onFileUploaded();
      setUploadProgress(0);
      toast({
        title: "Success",
        description: "Files uploaded successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      setUploadProgress(0);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadProgress(50); // Simulated progress
      uploadMutation.mutate(acceptedFiles);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div className="mb-6">
      <div
        {...getRootProps()}
        className={`glass border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center transition-all duration-300 ${
          isDragActive 
            ? "border-primary bg-primary/10 scale-105" 
            : "border-white/30 hover:border-primary/50 hover:bg-white/5"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center animate-bounce shadow-lg">
            <span className="text-xl sm:text-2xl">📤</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              {isDragActive ? "Drop files here!" : "Drop files here to upload"}
            </h3>
            <p className="text-white/60 mb-3 sm:mb-4 text-sm sm:text-base">or tap to browse from device</p>
            <Button 
              onClick={open}
              disabled={uploadMutation.isPending}
              className="gradient-secondary text-white px-4 py-2 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {(uploadMutation.isPending || uploadProgress > 0) && (
        <div className="mt-4 p-4 glass border border-white/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Uploading files...</span>
            <span className="text-sm text-white/60">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="mb-2" />
        </div>
      )}
    </div>
  );
}
