"use client";

import { Download, ImagePlus, Trash2, Upload, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useDashboardProfileAvatarCrop } from "../_hooks/use-dashboard-profile-avatar-crop";
import { styles } from "../dashboard.styles";

type DashboardProfileAvatarEditorProps = {
  displayedAvatarUrl: string | null;
  hasAvatar: boolean;
  isSaving: boolean;
  onAvatarDelete: () => void;
  onAvatarFileChange: (file: File | null) => void;
};

export function DashboardProfileAvatarEditor({
  displayedAvatarUrl,
  hasAvatar,
  isSaving,
  onAvatarDelete,
  onAvatarFileChange,
}: DashboardProfileAvatarEditorProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isAvatarModalClosing, setIsAvatarModalClosing] = useState(false);

  function startAvatarModalExit() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    setIsAvatarModalClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsAvatarModalClosing(false);
      closeTimerRef.current = null;
    }, 160);
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

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
    isAvatarModalOpen,
    modalTitleId,
    setIsAvatarModalOpen,
  } = useDashboardProfileAvatarCrop({
    displayedAvatarUrl,
    onAvatarModalClose: startAvatarModalExit,
    onAvatarDelete,
    onAvatarFileChange,
  });

  function openAvatarModal() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsAvatarModalClosing(false);
    setIsAvatarModalOpen(true);
  }

  function closeAvatarModal() {
    startAvatarModalExit();
    setIsAvatarModalOpen(false);
  }

  const shouldRenderAvatarModal = isAvatarModalOpen || isAvatarModalClosing;
  const shouldAnimateAvatarModalExit = isAvatarModalClosing && !isAvatarModalOpen;
  const avatarModal = shouldRenderAvatarModal ? (
    <div
      className={styles.avatarModalOverlay}
      data-closing={shouldAnimateAvatarModalExit}
      onClick={closeAvatarModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className={styles.avatarModal}
        data-closing={shouldAnimateAvatarModalExit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.avatarModalHead}>
          <h2 id={modalTitleId} className={styles.avatarModalTitle}>
            Edit profile photo
          </h2>
          <button
            type="button"
            className={styles.avatarModalClose}
            onClick={closeAvatarModal}
            aria-label="Close profile photo editor"
          >
            <X className={styles.buttonInlineIcon} aria-hidden="true" strokeWidth={1.9} />
          </button>
        </div>

        <input
          ref={modalAvatarInputRef}
          className={styles.profileFileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={isSaving}
          onChange={(event) => {
            const nextFile = event.currentTarget.files?.[0] ?? null;
            event.currentTarget.value = "";
            handleAvatarFile(nextFile);
          }}
        />

        <div className={styles.avatarModalPreviewWrap}>
          <div
            ref={cropFrameRef}
            className={styles.avatarCropFrame}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerEnd}
            onPointerCancel={handleCropPointerEnd}
          >
            {cropSourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- canvas cropping needs a direct HTMLImageElement.
              <img
                ref={cropImageRef}
                src={cropSourceUrl}
                alt=""
                className={styles.avatarCropImage}
                style={{
                  height: `${cropMetrics.height}px`,
                  transform: cropPreviewTransform,
                  width: `${cropMetrics.width}px`,
                }}
                onLoad={handleCropImageLoad}
              />
            ) : (
              <div className={styles.avatarCropEmpty}>No photo selected</div>
            )}
          </div>

          <div className={styles.avatarCropControls}>
            <label className={styles.avatarCropField}>
              <span>Resize</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(event) => handleZoomChange(Number(event.target.value))}
                disabled={!cropSourceUrl}
              />
            </label>

            <div className={styles.avatarCropActions}>
              <button
                type="button"
                className={styles.avatarModalButton}
                onClick={() => modalAvatarInputRef.current?.click()}
                disabled={isSaving}
              >
                <Upload className={styles.buttonInlineIcon} aria-hidden="true" strokeWidth={1.9} />
                Upload new
              </button>
              <button
                type="button"
                className={styles.avatarModalButton}
                onClick={() => void handleDownloadAvatar()}
                disabled={!cropSourceUrl}
              >
                <Download className={styles.buttonInlineIcon} aria-hidden="true" strokeWidth={1.9} />
                Download
              </button>
            </div>
          </div>
        </div>
        <div className={styles.avatarModalFooter}>
          <button
            type="button"
            className={styles.avatarModalButton}
            onClick={handleRemoveAvatar}
            disabled={!hasAvatar || isSaving}
          >
            <Trash2 className={styles.buttonInlineIcon} aria-hidden="true" strokeWidth={1.9} />
            Remove
          </button>
          <button
            type="button"
            className={styles.avatarModalButton}
            onClick={() => void handleApplyCrop()}
            disabled={!cropSourceUrl || isSaving}
          >
            Apply photo
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <input
        ref={avatarInputRef}
        id="profileAvatarImage"
        className={styles.profileFileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={isSaving}
          onChange={(event) => {
            const nextFile = event.currentTarget.files?.[0] ?? null;
            event.currentTarget.value = "";
            handleAvatarFile(nextFile);
          }}
      />
      <span className={styles.profilePhotoButton}>
        <button
          type="button"
          className={styles.profilePhotoPreview}
          data-has-image={hasAvatar}
          aria-label={hasAvatar ? "Edit profile picture" : "Upload profile picture"}
          disabled={isSaving}
          onClick={() => {
            if (hasAvatar) {
              openAvatarModal();
            } else {
              avatarInputRef.current?.click();
            }
          }}
          style={
            displayedAvatarUrl
              ? { backgroundImage: `url(${displayedAvatarUrl})` }
              : undefined
          }
        >
          {displayedAvatarUrl ? null : <ImagePlus aria-hidden="true" strokeWidth={1.9} />}
        </button>
        {!shouldRenderAvatarModal ? (
          <span className={styles.profilePhotoEditOverlay}>
            {hasAvatar ? "Edit" : "Upload"}
          </span>
        ) : null}
      </span>

      {avatarModal && typeof document !== "undefined"
        ? createPortal(avatarModal, document.body)
        : null}
    </>
  );
}
