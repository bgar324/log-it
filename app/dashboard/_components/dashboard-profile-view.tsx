"use client";

import { Download, ImagePlus, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { toast } from "sonner";
import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../dashboard.styles";
import type { DashboardProfileFormState } from "../_hooks/use-dashboard-profile-form";

type DashboardProfileViewProps = {
  state: DashboardProfileFormState;
};

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

export function DashboardProfileView({ state }: DashboardProfileViewProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null);
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
  const avatarUrl =
    state.profile.profileImageUpdatedAt
      ? `/api/profile/avatar?v=${encodeURIComponent(state.profile.profileImageUpdatedAt)}`
      : null;
  const displayedAvatarUrl = state.avatarRemovalPending
    ? null
    : state.avatarPreviewUrl ?? avatarUrl;
  const hasAvatar = Boolean(displayedAvatarUrl);
  const isSaving = state.saveState.kind === "saving";
  const displayName =
    [state.firstNameInput, state.lastNameInput].map((value) => value.trim()).filter(Boolean).join(" ") ||
    state.profile.username;
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
      const outputOffsetX = (clampedOffset.x / frameSize) * AVATAR_OUTPUT_SIZE;
      const outputOffsetY = (clampedOffset.y / frameSize) * AVATAR_OUTPUT_SIZE;
      const x = (AVATAR_OUTPUT_SIZE - width) / 2 + outputOffsetX;
      const y = (AVATAR_OUTPUT_SIZE - height) / 2 + outputOffsetY;

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
      state.handleAvatarFileChange(file);
      setIsAvatarModalOpen(false);
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

    setCropOffset({
      ...clampCropOffset({
        x: dragState.startX + event.clientX - dragState.startClientX,
        y: dragState.startY + event.clientY - dragState.startClientY,
      }),
    });
  }

  function handleCropPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (cropDragRef.current?.pointerId === event.pointerId) {
      cropDragRef.current = null;
    }
  }

  const cropMetrics = getCropMetrics();
  const cropPreviewTransform = `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px)`;

  return (
    <section className={styles.profilePanel}>
      <div className={styles.profileBody}>
        <aside className={styles.profileIdentityPanel}>
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
                  setIsAvatarModalOpen(true);
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
              {displayedAvatarUrl ? null : (
                <ImagePlus aria-hidden="true" strokeWidth={1.9} />
              )}
            </button>
            <span className={styles.profilePhotoEditOverlay}>
              {hasAvatar ? "Edit" : "Upload"}
            </span>
          </span>

          <div className={styles.profileIdentityText}>
            <p className={styles.profileRailName}>{displayName}</p>
            <Link
              href={`/u/${encodeURIComponent(state.profile.username)}`}
              className={styles.profileRailMeta}
            >
              @{state.profile.username}
            </Link>
          </div>

          <p className={styles.profileJoinedMeta}>Joined {state.profile.joinedAtLabel}</p>
        </aside>

        <div className={styles.profileEditorPanel}>
          <form
            id="profileSettingsForm"
            className={styles.profileForm}
            onSubmit={state.handleProfileSave}
          >
            <label className={styles.profileField} htmlFor="profileFirstName">
              <span>First name</span>
              <input
                id="profileFirstName"
                className={styles.profileInput}
                value={state.firstNameInput}
                onChange={(event) => state.setFirstNameInput(event.target.value)}
                maxLength={40}
              />
            </label>

            <label className={styles.profileField} htmlFor="profileLastName">
              <span>Last name</span>
              <input
                id="profileLastName"
                className={styles.profileInput}
                value={state.lastNameInput}
                onChange={(event) => state.setLastNameInput(event.target.value)}
                maxLength={40}
              />
            </label>

            <label className={styles.profileField}>
              <span>Username</span>
              <input className={styles.profileInput} value={state.profile.username} readOnly />
            </label>

            <label className={styles.profileField}>
              <span>Email</span>
              <input className={styles.profileInput} value={state.profile.email} readOnly />
            </label>

            <label className={styles.profileField} htmlFor="profileWeightUnit">
              <span>Weight unit</span>
              <select
                id="profileWeightUnit"
                className={styles.profileInput}
                value={state.preferredWeightUnitInput}
                onChange={(event) =>
                  state.setPreferredWeightUnitInput(event.target.value as WeightUnit)
                }
              >
                <option value="LB">Pounds (lb)</option>
                <option value="KG">Kilograms (kg)</option>
              </select>
            </label>

            <label className={styles.profileField} htmlFor="profileVisibility">
              <span>Visibility</span>
              <select
                id="profileVisibility"
                className={styles.profileInput}
                value={state.publicProfileEnabledInput ? "public" : "private"}
                onChange={(event) =>
                  state.setPublicProfileEnabledInput(event.target.value === "public")
                }
              >
                <option value="public">Public profile</option>
                <option value="private">Private profile</option>
              </select>
            </label>
          </form>

          <div className={styles.profileFooter}>
            <div className={styles.profileActions}>
              <button
                type="submit"
                form="profileSettingsForm"
                className={styles.profileSaveButton}
                disabled={isSaving}
                aria-busy={isSaving}
              >
                Save profile
              </button>

              <form method="post" action="/auth/signout" className={styles.profileActionForm}>
                <button type="submit" className={styles.profileSignOutButton}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {isAvatarModalOpen ? (
        <div
          className={styles.avatarModalOverlay}
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className={styles.avatarModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.avatarModalHead}>
              <h2 id={modalTitleId} className={styles.avatarModalTitle}>
                Edit profile photo
              </h2>
              <button
                type="button"
                className={styles.avatarModalClose}
                onClick={() => setIsAvatarModalOpen(false)}
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
                    onLoad={(event) => {
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
                    }}
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
                    onChange={(event) => {
                      const nextZoom = Number(event.target.value);
                      setCropZoom(nextZoom);
                      setCropOffset((current) => clampCropOffset(current, nextZoom));
                    }}
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
                onClick={() => {
                  if (avatarEditorObjectUrlRef.current) {
                    URL.revokeObjectURL(avatarEditorObjectUrlRef.current);
                    avatarEditorObjectUrlRef.current = null;
                  }
                  setAvatarEditorSourceUrl(null);
                  state.handleAvatarDelete();
                  setIsAvatarModalOpen(false);
                  resetCrop();
                }}
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
      ) : null}
    </section>
  );
}
