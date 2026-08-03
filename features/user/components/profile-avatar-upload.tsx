"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { updateProfileImage, removeProfileImage } from "@/features/user/user-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MIN_FILE_SIZE = 10 * 1024; // 10 KB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MIN_DIMENSION = 128; // 128px
const MAX_DIMENSION = 4096; // 4096px
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

function checkImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for validation"));
    };
    img.src = url;
  });
}

interface ProfileAvatarUploadProps {
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export function ProfileAvatarUpload({ user }: ProfileAvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initials = getInitials(user.name);
  const isLoading = isUploading || isDeleting;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!file.type.startsWith("image/") || !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP, GIF)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size bounds (10KB - 5MB)
    if (file.size < MIN_FILE_SIZE) {
      toast.error("Image file is too small (minimum size is 10 KB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file is too large (maximum size is 5 MB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate image pixel dimension bounds (128x128 to 4096x4096px)
    try {
      const { width, height } = await checkImageDimensions(file);
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        toast.error(
          `Image resolution is too low (${width}×${height}px). Minimum dimensions are ${MIN_DIMENSION}×${MIN_DIMENSION}px.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        toast.error(
          `Image resolution is too high (${width}×${height}px). Maximum dimensions are ${MAX_DIMENSION}×${MAX_DIMENSION}px.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } catch (err: unknown) {
      toast.error("Could not verify image dimensions. Please select a valid image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    try {
      // 1. Get presigned upload URL
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "image/jpeg",
          purpose: "avatar",
        }),
      });

      if (!presignRes.ok) {
        const errorData = await presignRes.json().catch(() => null);
        throw new Error(
          errorData?.error || "Failed to get upload authorization"
        );
      }

      const { uploadUrl, key } = await presignRes.json();

      // 2. Direct upload to R2
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload image file to storage");
      }

      // 3. Update database record via server action
      const actionRes = await updateProfileImage({ fileKey: key });
      if (!actionRes.ok) {
        throw new Error(actionRes.error || "Failed to update profile picture");
      }

      toast.success("Profile picture updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during upload";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemovePhoto() {
    setIsDeleting(true);
    try {
      const res = await removeProfileImage();
      if (!res.ok) {
        throw new Error(res.error || "Failed to remove profile picture");
      }
      toast.success("Profile picture removed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove profile picture";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative group flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isLoading}
          className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer group/avatar text-left shrink-0"
          title="Change profile picture"
        >
          <Avatar className="size-16 w-16 h-16 shrink-0 overflow-hidden border-2 border-primary/20 shadow-sm transition-opacity group-hover/avatar:opacity-90">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Dark backdrop overlay on hover */}
          <div
            className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity ${
              isLoading ? "opacity-100" : "opacity-0 group-hover/avatar:opacity-100"
            }`}
          >
            {isLoading ? (
              <Loader2 className="size-5 text-white animate-spin" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </div>

          {/* Corner camera button badge on hover */}
          <div
            className={`absolute -bottom-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background transition-opacity ${
              isLoading ? "opacity-100" : "opacity-0 group-hover/avatar:opacity-100"
            }`}
          >
            {isLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Camera className="size-3" />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            <Upload className="mr-2 size-4 text-muted-foreground" />
            <span>Upload new photo</span>
          </DropdownMenuItem>

          {user.image && (
            <DropdownMenuItem
              variant="destructive"
              onClick={handleRemovePhoto}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 size-4" />
              <span>Remove photo</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
