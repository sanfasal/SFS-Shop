"use client";

import { useRef, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api-error";
import { UPLOAD_ACCEPT, uploadProblem, uploadProductImage } from "@/lib/products";

// Round avatar preview with Upload / Remove buttons. `value` is the photo URL.
export function ProfilePhotoInput({
  value,
  onChange,
  onUploadingChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // Local preview of the file being uploaded — never sent to the API.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const preview = localPreview ?? value;

  function setUploadingState(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function handleFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    const problem = uploadProblem(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setFailed(false);
    setLocalPreview(URL.createObjectURL(file));
    setUploadingState(true);
    try {
      onChange(await uploadProductImage(file));
    } catch (err) {
      setError(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      setLocalPreview((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      setUploadingState(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
          {preview && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded URL or local object URL
            <img
              src={preview}
              alt="Profile photo"
              className="size-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <UserRound className="absolute inset-0 m-auto size-8 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-5"
            >
              Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !value}
              onClick={() => {
                onChange("");
                setFailed(false);
                setError(null);
              }}
              className="px-5"
            >
              Remove
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG or HEIC 1.5 MB Max</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
