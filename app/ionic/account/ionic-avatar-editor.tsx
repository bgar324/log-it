"use client";

import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonRange,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  cloudUploadOutline,
  downloadOutline,
  imageOutline,
  trashOutline,
} from "ionicons/icons";
import { useRef, useState } from "react";
import { useDashboardProfileAvatarCrop } from "@/app/dashboard/_hooks/use-dashboard-profile-avatar-crop";

type IonicAvatarEditorProps = {
  displayedAvatarUrl: string | null;
  hasAvatar: boolean;
  isSaving: boolean;
  onAvatarDelete: () => void;
  onAvatarFileChange: (file: File | null) => void;
};

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Same crop pipeline as the dashboard editor (pan, zoom, 640px square JPEG)
 * hosted in an IonModal. The crop math lives in the shared hook; only the
 * chrome is Ionic.
 */
export function IonicAvatarEditor({
  displayedAvatarUrl,
  hasAvatar,
  isSaving,
  onAvatarDelete,
  onAvatarFileChange,
}: IonicAvatarEditorProps) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [isImageReady, setIsImageReady] = useState(false);

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
    openAvatarEditor,
    handleCancelCrop,
  } = useDashboardProfileAvatarCrop({
    displayedAvatarUrl,
    onAvatarDelete,
    onAvatarFileChange,
  });

  return (
    <>
      <input
        ref={pickerRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        hidden
        disabled={isSaving}
        onChange={(event) => {
          const nextFile = event.currentTarget.files?.[0] ?? null;
          event.currentTarget.value = "";
          setIsImageReady(false);
          handleAvatarFile(nextFile);
        }}
      />

      <button
        type="button"
        aria-label={hasAvatar ? "Edit profile photo" : "Upload a profile photo"}
        disabled={isSaving}
        onClick={() => {
          if (hasAvatar) {
            setIsImageReady(false);
            openAvatarEditor();
            return;
          }

          pickerRef.current?.click();
        }}
        style={{
          background: "none",
          border: "none",
          borderRadius: "999px",
          padding: 0,
        }}
      >
        <IonAvatar
          style={{
            alignItems: "center",
            background: "var(--ion-color-step-100, rgba(128,128,128,0.16))",
            display: "flex",
            height: "72px",
            justifyContent: "center",
            width: "72px",
          }}
        >
          {displayedAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Ionic avatar wraps a plain image; the bytes come from our own API.
            <img src={displayedAvatarUrl} alt="" />
          ) : (
            <IonIcon
              aria-hidden="true"
              icon={imageOutline}
              style={{ fontSize: "26px" }}
            />
          )}
        </IonAvatar>
      </button>

      <IonModal
        isOpen={isAvatarModalOpen}
        canDismiss={!isSaving}
        onIonModalDidDismiss={() => {
          handleCancelCrop();
          setIsImageReady(false);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Profile photo</IonTitle>
            <IonButtons slot="end">
              <IonButton disabled={isSaving} onClick={handleCancelCrop}>
                Cancel
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding" inert={isSaving}>
          <p>Drag to reposition, then resize until the crop looks right.</p>

          <div
            ref={cropFrameRef}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerEnd}
            onPointerCancel={handleCropPointerEnd}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: "999px",
              cursor: cropSourceUrl ? "grab" : "default",
              margin: "0 auto",
              maxWidth: "280px",
              overflow: "hidden",
              position: "relative",
              touchAction: "none",
              width: "100%",
              background: "var(--ion-color-step-100, rgba(128,128,128,0.16))",
            }}
          >
            {cropSourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- canvas cropping needs a direct HTMLImageElement.
              <img
                ref={cropImageRef}
                src={cropSourceUrl}
                alt=""
                draggable={false}
                onLoad={(event) => {
                  handleCropImageLoad(event);
                  setIsImageReady(true);
                }}
                style={{
                  height: `${cropMetrics.height}px`,
                  left: "50%",
                  position: "absolute",
                  top: "50%",
                  transform: cropPreviewTransform,
                  width: `${cropMetrics.width}px`,
                  maxWidth: "none",
                }}
              />
            ) : (
              <p
                style={{
                  left: 0,
                  position: "absolute",
                  right: 0,
                  textAlign: "center",
                  top: "45%",
                }}
              >
                No photo selected
              </p>
            )}
          </div>

          <IonItem lines="none">
            <IonLabel>Resize</IonLabel>
            <IonRange
              aria-label="Resize profile photo"
              disabled={!cropSourceUrl}
              max={3}
              min={1}
              step={0.05}
              value={cropZoom}
              onIonInput={(event) => {
                const nextValue = event.detail.value;

                if (typeof nextValue === "number") {
                  handleZoomChange(nextValue);
                }
              }}
            />
          </IonItem>

          <IonButton
            expand="block"
            fill="outline"
            disabled={isSaving}
            onClick={() => pickerRef.current?.click()}
          >
            <IonIcon slot="start" icon={cloudUploadOutline} />
            Choose another photo
          </IonButton>

          <IonButton
            expand="block"
            fill="clear"
            disabled={!cropSourceUrl || !isImageReady}
            onClick={() => void handleDownloadAvatar()}
          >
            <IonIcon slot="start" icon={downloadOutline} />
            Download this crop
          </IonButton>

          <IonButton
            expand="block"
            fill="clear"
            color="danger"
            disabled={!hasAvatar || isSaving}
            onClick={handleRemoveAvatar}
          >
            <IonIcon slot="start" icon={trashOutline} />
            Remove photo
          </IonButton>
        </IonContent>

        <IonFooter>
          <IonToolbar>
            <IonButton
              expand="block"
              disabled={!cropSourceUrl || !isImageReady || isSaving}
              onClick={() => void handleApplyCrop()}
            >
              Save photo
            </IonButton>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </>
  );
}
