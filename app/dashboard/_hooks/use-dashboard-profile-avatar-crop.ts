"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent, SyntheticEvent } from "react";
import { toast } from "sonner";

const AVATAR_OUTPUT_SIZE = 640;

type CropDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

type CropSize = {
  width: number;
  height: number;
};

type UseDashboardProfileAvatarCropArgs = {
  displayedAvatarUrl: string | null;
  onAvatarModalClose?: () => void;
  onAvatarDelete: () => void;
  onAvatarFileChange: (file: File | null) => void;
};

export function useDashboardProfileAvatarCrop({
  displayedAvatarUrl,
  onAvatarModalClose,
  onAvatarDelete,
  onAvatarFileChange,
}: UseDashboardProfileAvatarCropArgs) {
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const cropFrameRef = useRef<HTMLDivElement | null>(null);
  const cropDragRef = useRef<CropDragState | null>(null);
  const avatarEditorObjectUrlRef = useRef<string | null>(null);
  const modalTitleId = useId();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarEditorSourceUrl, setAvatarEditorSourceUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropFrameSize, setCropFrameSize] = useState(0);
  const [cropImageSize, setCropImageSize] = useState<CropSize>({ width: 0, height: 0 });
  const cropSourceUrl = avatarEditorSourceUrl ?? displayedAvatarUrl;

  useEffect(() => {
    return () => {
      if (avatarEditorObjectUrlRef.current) {
        URL.revokeObjectURL(avatarEditorObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAvatarModalOpen || !cropFrameRef.current) {
      return;
    }

    const frame = cropFrameRef.current;
    const updateFrameSize = () => {
      const nextSize = frame.clientWidth;
      setCropFrameSize(nextSize);
      setCropOffset((current) => {
        if (!nextSize || !cropImageSize.width || !cropImageSize.height) {
          return current;
        }

        const coverScale = Math.max(nextSize / cropImageSize.width, nextSize / cropImageSize.height);
        const width = cropImageSize.width * coverScale * cropZoom;
        const height = cropImageSize.height * coverScale * cropZoom;
        const bounds = {
          x: Math.max(0, (width - nextSize) / 2),
          y: Math.max(0, (height - nextSize) / 2),
        };

        return {
          x: Math.max(-bounds.x, Math.min(bounds.x, current.x)),
          y: Math.max(-bounds.y, Math.min(bounds.y, current.y)),
        };
      });
    };

    updateFrameSize();

    const observer = new ResizeObserver(updateFrameSize);
    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, [cropImageSize, cropZoom, isAvatarModalOpen]);

  function resetCrop() {
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropImageSize({ height: 0, width: 0 });
  }

  function closeAvatarModal() {
    onAvatarModalClose?.();
    setIsAvatarModalOpen(false);
  }

  function getCropMetrics(
    zoom = cropZoom,
    frameSize = cropFrameSize || cropFrameRef.current?.clientWidth || 0,
    imageSize = cropImageSize,
  ) {
    if (!frameSize || !imageSize.width || !imageSize.height) {
      return {
        bounds: { x: 0, y: 0 },
        height: frameSize,
        width: frameSize,
      };
    }

    const coverScale = Math.max(frameSize / imageSize.width, frameSize / imageSize.height);
    const width = imageSize.width * coverScale * zoom;
    const height = imageSize.height * coverScale * zoom;

    return {
      bounds: {
        x: Math.max(0, (width - frameSize) / 2),
        y: Math.max(0, (height - frameSize) / 2),
      },
      height,
      width,
    };
  }

  function clampCropOffset(
    offset: { x: number; y: number },
    zoom = cropZoom,
    frameSize = cropFrameSize || cropFrameRef.current?.clientWidth || 0,
    imageSize = cropImageSize,
  ) {
    const { bounds } = getCropMetrics(zoom, frameSize, imageSize);

    return {
      x: Math.max(-bounds.x, Math.min(bounds.x, offset.x)),
      y: Math.max(-bounds.y, Math.min(bounds.y, offset.y)),
    };
  }

  function handleAvatarFile(file: File | null) {
    if (!file) {
      return;
    }

    if (avatarEditorObjectUrlRef.current) {
      URL.revokeObjectURL(avatarEditorObjectUrlRef.current);
    }

    const sourceUrl = URL.createObjectURL(file);
    avatarEditorObjectUrlRef.current = sourceUrl;
    setAvatarEditorSourceUrl(sourceUrl);
    resetCrop();
    setIsAvatarModalOpen(true);
  }

  function createCroppedAvatarBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const image = cropImageRef.current;

      if (!image || !cropSourceUrl) {
        reject(new Error("Choose a profile photo first."));
        return;
      }

      if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
        reject(new Error("The profile photo is still loading."));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to prepare this profile photo."));
        return;
      }

      const baseScale = Math.max(
        AVATAR_OUTPUT_SIZE / image.naturalWidth,
        AVATAR_OUTPUT_SIZE / image.naturalHeight,
      );
      const scale = baseScale * cropZoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const frameSize = cropFrameRef.current?.clientWidth ?? AVATAR_OUTPUT_SIZE;
      const clampedOffset = clampCropOffset(cropOffset, cropZoom, frameSize, {
        height: image.naturalHeight,
        width: image.naturalWidth,
      });
      const x = (AVATAR_OUTPUT_SIZE - width) / 2 + (clampedOffset.x / frameSize) * AVATAR_OUTPUT_SIZE;
      const y = (AVATAR_OUTPUT_SIZE - height) / 2 + (clampedOffset.y / frameSize) * AVATAR_OUTPUT_SIZE;

      context.fillStyle = "#fff";
      context.fillRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
      context.drawImage(image, x, y, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to crop this profile photo."));
          return;
        }

        resolve(blob);
      }, "image/jpeg", 0.9);
    });
  }

  async function handleApplyCrop() {
    try {
      const blob = await createCroppedAvatarBlob();
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      onAvatarFileChange(file);
      closeAvatarModal();
      resetCrop();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to crop this profile photo.");
    }
  }

  async function handleDownloadAvatar() {
    const toastId = toast.loading("Preparing profile photo...");

    try {
      const blob = await createCroppedAvatarBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "logit-profile-photo.jpg";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Profile photo downloaded.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download this profile photo.", {
        id: toastId,
      });
    }
  }

  function handleCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!cropSourceUrl) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: cropOffset.x,
      startY: cropOffset.y,
    };
  }

  function handleCropPointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragState = cropDragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    setCropOffset(
      clampCropOffset({
        x: dragState.startX + event.clientX - dragState.startClientX,
        y: dragState.startY + event.clientY - dragState.startClientY,
      }),
    );
  }

  function handleCropPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (cropDragRef.current?.pointerId === event.pointerId) {
      cropDragRef.current = null;
    }
  }

  function handleCropImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const nextImageSize = {
      height: image.naturalHeight,
      width: image.naturalWidth,
    };
    const nextFrameSize = cropFrameRef.current?.clientWidth ?? cropFrameSize;
    setCropImageSize(nextImageSize);
    setCropFrameSize(nextFrameSize);
    setCropOffset((current) =>
      clampCropOffset(current, cropZoom, nextFrameSize, nextImageSize),
    );
  }

  function handleZoomChange(value: number) {
    setCropZoom(value);
    setCropOffset((current) => clampCropOffset(current, value));
  }

  function handleRemoveAvatar() {
    if (avatarEditorObjectUrlRef.current) {
      URL.revokeObjectURL(avatarEditorObjectUrlRef.current);
      avatarEditorObjectUrlRef.current = null;
    }
    setAvatarEditorSourceUrl(null);
    onAvatarDelete();
    closeAvatarModal();
    resetCrop();
  }

  const cropMetrics = getCropMetrics();

  return {
    cropFrameRef,
    cropImageRef,
    cropMetrics,
    cropPreviewTransform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
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
    isAvatarModalOpen,
    modalTitleId,
    setIsAvatarModalOpen,
  };
}
