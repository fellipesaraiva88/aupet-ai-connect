import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  Camera,
  FileImage,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  preview?: string;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string;
  placeholder?: string;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  preview,
  uploading = false,
  uploadProgress = 0,
  error,
  placeholder = "Clique ou arraste uma foto aqui"
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (preview && !uploading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <div className="aspect-square w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = acceptedTypes.join(',');
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && onFileSelect) {
                      onFileSelect(file);
                    }
                  };
                  input.click();
                }}
              >
                <Camera className="h-4 w-4 mr-1" />
                Trocar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onFileRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive || dragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
          uploading && "pointer-events-none",
          error && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Enviando foto...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{uploadProgress}% concluído</p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">Erro no upload</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <FileImage className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: JPG, PNG, WebP (até {maxSize}MB)
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Escolher arquivo
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}