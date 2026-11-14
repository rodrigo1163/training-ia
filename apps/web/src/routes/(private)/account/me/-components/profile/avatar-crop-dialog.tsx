import { Cropper } from "@origin-space/image-cropper";
import { LoaderCircleIcon, ZoomInIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@training-ia/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@training-ia/ui/components/ui/dialog";
import { Slider } from "@training-ia/ui/components/ui/slider";

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AvatarCropDialogProps = {
  file: File | null;
  onCropped: (file: File) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read this image."));
    image.src = source;
  });
}

async function createCroppedFile(source: string, area: CropArea) {
  const image = await loadImage(source);
  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare the cropped image.");

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.9);
  });
  if (!blob) throw new Error("Unable to create the cropped image.");

  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export function AvatarCropDialog({
  file,
  onCropped,
  onOpenChange,
  open,
}: AvatarCropDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      setCropArea(null);
      return;
    }

    const nextImageUrl = URL.createObjectURL(file);
    setImageUrl(nextImageUrl);
    setCropArea(null);
    setZoom(1);
    setError(null);

    return () => URL.revokeObjectURL(nextImageUrl);
  }, [file]);

  async function handleCrop() {
    if (!imageUrl || !cropArea) return;

    setIsSaving(true);
    setError(null);

    try {
      const croppedFile = await createCroppedFile(imageUrl, cropArea);
      onCropped(croppedFile);
      onOpenChange(false);
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Unable to crop this image.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop avatar</DialogTitle>
          <DialogDescription>
            Drag the image to position it inside the circular frame, then use
            the zoom control if needed.
          </DialogDescription>
        </DialogHeader>

        {imageUrl && (
          <div className="flex flex-col gap-4">
            <Cropper.Root
              aspectRatio={1}
              className="relative mx-auto aspect-square w-full max-w-sm cursor-move touch-none overflow-hidden rounded-xl bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              image={imageUrl}
              maxZoom={3}
              minZoom={1}
              onCropChange={setCropArea}
              onZoomChange={setZoom}
              zoom={zoom}
            >
              <Cropper.Description className="sr-only">
                Drag to reposition the image and use the mouse wheel or pinch
                gesture to zoom.
              </Cropper.Description>
              <Cropper.Image className="pointer-events-none h-full w-full select-none object-cover" />
              <Cropper.CropArea className="pointer-events-none absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.58)]" />
            </Cropper.Root>

            <label className="flex items-center gap-3" htmlFor="avatar-zoom">
              <ZoomInIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="sr-only">Zoom</span>
              <Slider
                aria-label="Zoom"
                className="flex-1"
                id="avatar-zoom"
                max={3}
                min={1}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
                step={0.05}
                value={[zoom]}
              />
            </label>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!imageUrl || !cropArea || isSaving}
            onClick={() => void handleCrop()}
            type="button"
          >
            {isSaving && <LoaderCircleIcon className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
