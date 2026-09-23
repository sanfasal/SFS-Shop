"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImageOff, Upload, X } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

type ImageInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ImageInput({ value, onChange }: ImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be smaller than 2 MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewFailed(false);
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    onChange("");
    setPreviewFailed(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30"
        >
          {previewFailed ? (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImageOff className="size-6" />
              <p className="text-xs">Couldn&apos;t load this image.</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- previews an arbitrary user-supplied URL or local file as a data URI
            <img
              src={value}
              alt=""
              className="size-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/40 group-hover:opacity-100">
            <span className="text-xs font-medium text-white">Click to replace</span>
          </div>
          <button
            type="button"
            aria-label="Remove image"
            onClick={(e) => {
              e.stopPropagation();
              removeImage();
            }}
            className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-background"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-foreground/40 bg-accent/60"
              : "border-border bg-muted/30 hover:bg-accent/30"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-foreground/5">
            <Upload className="size-4.5 text-foreground/70" />
          </div>
          <p className="text-sm font-medium">Drag your file here</p>
          <p className="text-xs text-muted-foreground">or</p>
          <span className="text-xs font-medium underline underline-offset-2">
            Browse files
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          or paste a URL
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Input
        type="url"
        placeholder="https://..."
        value={value}
        onChange={(e) => {
          setPreviewFailed(false);
          setError(null);
          onChange(e.target.value);
        }}
      />
    </div>
  );
}
