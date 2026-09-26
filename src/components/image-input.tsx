"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { isAxiosError } from "axios";
import { ImageOff, Loader2, Upload, X } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { uploadProductImage } from "@/lib/products";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_URL_LENGTH = 500;

type ImageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function ImageInput({ value, onChange, onUploadingChange }: ImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  // Local data-URI preview of a file being uploaded — never sent to the API.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const preview = localPreview ?? value;

  function setUploadingState(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function handleFiles(files: FileList | null) {
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
    setPreviewFailed(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLocalPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploadingState(true);
    try {
      const url = await uploadProductImage(file);
      onChange(url);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setError("The API doesn't support file uploads yet. Paste an image URL instead.");
      } else {
        const message = isAxiosError(err) ? err.response?.data?.error : null;
        setError(message ?? "Upload failed. Please try again.");
      }
    } finally {
      setLocalPreview(null);
      setUploadingState(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // The API stores imageUrl as a string of at most 500 characters.
  function applyUrl(raw: string) {
    const url = raw.trim();
    if (!/^https?:\/\//i.test(url)) {
      setError("Image URL must start with http:// or https://.");
      return false;
    }
    if (url.length > MAX_URL_LENGTH) {
      setError(`Image URL must be ${MAX_URL_LENGTH} characters or fewer.`);
      return false;
    }
    setError(null);
    setPreviewFailed(false);
    onChange(url);
    return true;
  }

  function commitUrl() {
    if (!urlDraft.trim()) return;
    if (applyUrl(urlDraft)) setUrlDraft("");
  }

  // Ctrl+V on the drop zone: upload a copied image, or use copied text as a URL.
  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
      return;
    }
    const text = e.clipboardData.getData("text").trim();
    if (text) {
      e.preventDefault();
      applyUrl(text);
    }
  }

  function removeImage() {
    onChange("");
    setLocalPreview(null);
    setPreviewFailed(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!uploading && (e.key === "Enter" || e.key === " ")) {
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
              src={preview}
              alt=""
              className="size-full object-cover"
              onError={() => setPreviewFailed(true)}
            />
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-xs font-medium text-white">
              <Loader2 className="size-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <>
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
            </>
          )}
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
            if (e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
              return;
            }
            // Images dragged from another browser tab arrive as a link, not a file.
            const url = e.dataTransfer.getData("text/uri-list").split("\n")[0]?.trim();
            if (url) applyUrl(url);
          }}
          onPaste={handlePaste}
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
          <Input
            type="url"
            placeholder="or paste an image URL"
            value={urlDraft}
            className="mt-2 h-8 max-w-64 bg-background text-center text-xs"
            // Keep clicks and keys in the field from opening the file picker.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                commitUrl();
              }
            }}
            onPaste={(e) => e.stopPropagation()}
            onChange={(e) => setUrlDraft(e.target.value)}
            onBlur={commitUrl}
          />
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
    </div>
  );
}
