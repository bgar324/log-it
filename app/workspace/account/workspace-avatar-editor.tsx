"use client";

import { Download, ImagePlus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/workspace-ui/dialog";
import { Label } from "@/app/components/workspace-ui/label";
import { useDashboardProfileAvatarCrop } from "@/app/dashboard/_hooks/use-dashboard-profile-avatar-crop";

export type WorkspaceAvatarEditorProps = {
  displayedAvatarUrl: string | null;
  hasAvatar: boolean;
  isSaving: boolean;
  onAvatarDelete: () => void;
  onAvatarFileChange: (file: File | null) => void;
};

type CropFrameGeometry = {
  height: number;
  sourceUrl: string | null;
  transform: string;
  width: number;
};

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/**
 * The avatar is one round control that opens a single editor: pick, reposition,
 * resize, download, or remove. All of the geometry maths stays in the shared
 * crop hook, which is pure DOM work and has nothing to do with the old styling.
 */
export function WorkspaceAvatarEditor({
  displayedAvatarUrl,
  hasAvatar,
  isSaving,
  onAvatarDelete,
  onAvatarFileChange,
}: WorkspaceAvatarEditorProps) {
  const pickerInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const {
    cropFrameRef,
    cropImageRef,
    cropMetrics,
    cropPreviewTransform,
    cropSourceUrl,
    cropZoom,
    handleApplyCrop,
    handleAvatarFile,
    handleCropImageLoad,
    handleCropPointerDown,
    handleCropPointerEnd,
    handleCropPointerMove,
    handleDownloadAvatar,
    handleRemoveAvatar,
    handleZoomChange,
    handleCancelCrop,
    isAvatarModalOpen,
    setIsAvatarModalOpen,
  } = useDashboardProfileAvatarCrop({
    displayedAvatarUrl,
    onAvatarDelete,
    onAvatarFileChange,
  });

  const [retainedFrame, setRetainedFrame] = useState<CropFrameGeometry>({
    height: 0,
    sourceUrl: null,
    transform: "translate(-50%, -50%)",
    width: 0,
  });

  function retainFrame() {
    setRetainedFrame({
      height: cropMetrics.height,
      sourceUrl: cropSourceUrl,
      transform: cropPreviewTransform,
      width: cropMetrics.width,
    });
  }

  function closeDialog() {
    retainFrame();
    handleCancelCrop();
  }

  // Radix keeps the dialog mounted through its exit animation, and applying or
  // removing a photo resets the crop in the same tick that closes it. Painting
  // the last committed geometry while the panel animates away is what stops the
  // frame collapsing to "No photo selected" mid-close.
  const frame: CropFrameGeometry = isAvatarModalOpen
    ? {
        height: cropMetrics.height,
        sourceUrl: cropSourceUrl,
        transform: cropPreviewTransform,
        width: cropMetrics.width,
      }
    : retainedFrame;

  function readFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    handleAvatarFile(nextFile);
  }

  return (
    <>
      <input
        ref={pickerInputRef}
        id="workspaceProfileAvatarImage"
        className="sr-only"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        disabled={isSaving}
        onChange={readFileInput}
      />

      <button
        type="button"
        aria-label={hasAvatar ? "Edit profile photo" : "Upload a profile photo"}
        data-has-image={hasAvatar}
        className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted bg-cover bg-center text-muted-foreground ring-1 ring-foreground/10 transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 sm:size-24 [&_svg]:size-6"
        style={
          displayedAvatarUrl
            ? { backgroundImage: `url(${displayedAvatarUrl})` }
            : undefined
        }
        disabled={isSaving}
        onClick={() => {
          if (hasAvatar) {
            setIsAvatarModalOpen(true);
            return;
          }

          pickerInputRef.current?.click();
        }}
      >
        <span className="flex size-full items-center justify-center">
          {displayedAvatarUrl ? null : <ImagePlus strokeWidth={1.8} />}
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-[0.7rem] font-medium text-background">
          {hasAvatar ? "Edit" : "Upload"}
        </span>
      </button>

      {/* Nothing is uploaded from inside this dialog: applying a crop closes it
          and the request runs behind the avatar, which is why dismissal is not
          locked here. Every action still disables while a request is in flight. */}
      <Dialog
        open={isAvatarModalOpen}
        onOpenChange={(next) => next ? setIsAvatarModalOpen(true) : closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile photo</DialogTitle>
            <DialogDescription>
              Drag the photo to reposition it and resize until the circle holds
              what you want.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={replaceInputRef}
            className="sr-only"
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            disabled={isSaving}
            onChange={readFileInput}
          />

          <div className="flex flex-col gap-4">
            <div
              ref={cropFrameRef}
              className="relative mx-auto aspect-square w-full max-w-60 touch-none overflow-hidden rounded-full bg-muted select-none"
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerEnd}
              onPointerCancel={handleCropPointerEnd}
            >
              {frame.sourceUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- canvas cropping needs a direct HTMLImageElement.
                <img
                  ref={cropImageRef}
                  src={frame.sourceUrl}
                  alt=""
                  draggable={false}
                  className="absolute top-1/2 left-1/2 max-w-none object-cover"
                  style={{
                    height: `${frame.height}px`,
                    transform: frame.transform,
                    width: `${frame.width}px`,
                  }}
                  onLoad={handleCropImageLoad}
                />
              ) : (
                <span className="flex size-full items-center justify-center text-sm text-muted-foreground">
                  No photo selected
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspaceProfileAvatarZoom">Resize</Label>
              <input
                id="workspaceProfileAvatarZoom"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                disabled={!frame.sourceUrl || isSaving}
                className="h-11 w-full accent-primary disabled:opacity-50"
                onChange={(event) => handleZoomChange(Number(event.target.value))}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => replaceInputRef.current?.click()}
              >
                <Upload />
                Upload new
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!frame.sourceUrl || isSaving}
                onClick={() => void handleDownloadAvatar()}
              >
                <Download />
                Download
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!hasAvatar || isSaving}
                onClick={() => {
                  retainFrame();
                  handleRemoveAvatar();
                }}
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!frame.sourceUrl || isSaving}
              onClick={() => {
                retainFrame();
                void handleApplyCrop();
              }}
            >
              {isSaving ? "Saving photo…" : "Apply photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
