import { useEffect, useRef, useState } from "react";

import { Button } from "@training-ia/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@training-ia/ui/components/ui/dialog";
import { Input } from "@training-ia/ui/components/ui/input";

const VIEWPORT_SIZE = 320;

type Position = { x: number; y: number };

function clampPosition(
  position: Position,
  image: HTMLImageElement,
  scale: number,
): Position {
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  return {
    x: Math.min(0, Math.max(VIEWPORT_SIZE - width, position.x)),
    y: Math.min(0, Math.max(VIEWPORT_SIZE - height, position.y)),
  };
}

export function AvatarCropDialog({
  file,
  onCropped,
  onOpenChange,
  open,
}: {
  file: File | null;
  onCropped: (file: File) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    position: Position;
  } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const baseScale = image
    ? Math.max(
        VIEWPORT_SIZE / image.naturalWidth,
        VIEWPORT_SIZE / image.naturalHeight,
      )
    : 1;
  const scale = baseScale * zoom;

  useEffect(() => {
    if (!file) {
      setImage(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.onload = () => {
      setImage(nextImage);
      setZoom(1);
      const imageScale = Math.max(
        VIEWPORT_SIZE / nextImage.naturalWidth,
        VIEWPORT_SIZE / nextImage.naturalHeight,
      );
      setPosition({
        x: (VIEWPORT_SIZE - nextImage.naturalWidth * imageScale) / 2,
        y: (VIEWPORT_SIZE - nextImage.naturalHeight * imageScale) / 2,
      });
    };
    nextImage.src = url;
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setImageUrl(null);
    };
  }, [file]); // The image is loaded once per selected file.

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !image) return;

    const nextPosition = clampPosition(position, image, scale);
    if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
      setPosition(nextPosition);
      return;
    }

    canvas.width = VIEWPORT_SIZE;
    canvas.height = VIEWPORT_SIZE;
    context.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    context.drawImage(
      image,
      position.x,
      position.y,
      image.naturalWidth * scale,
      image.naturalHeight * scale,
    );
  }, [image, position, scale]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      position,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !image) return;
    const nextPosition = clampPosition(
      {
        x:
          dragRef.current.position.x + event.clientX - dragRef.current.pointerX,
        y:
          dragRef.current.position.y + event.clientY - dragRef.current.pointerY,
      },
      image,
      scale,
    );
    setPosition(nextPosition);
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(value: number) {
    setZoom(value);
    if (image) setPosition(clampPosition(position, image, baseScale * value));
  }

  function handleCrop() {
    if (!image || !canvasRef.current) return;

    const sourceSize = VIEWPORT_SIZE / scale;
    const outputSize = Math.max(1, Math.round(sourceSize));
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const context = outputCanvas.getContext("2d");
    if (!context) return;

    context.drawImage(
      image,
      -position.x / scale,
      -position.y / scale,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize,
    );
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const extension = blob.type === "image/webp" ? "webp" : "jpg";
        onCropped(new File([blob], `avatar.${extension}`, { type: blob.type }));
        onOpenChange(false);
      },
      "image/webp",
      0.9,
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop avatar</DialogTitle>
          <DialogDescription>
            Drag the image to position it inside the square.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas
            aria-label="Avatar crop area"
            className="size-80 max-w-full cursor-move touch-none rounded-lg bg-muted object-contain"
            onPointerCancel={handlePointerUp}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={canvasRef}
          />
          <label
            className="flex w-full items-center gap-3 text-sm"
            htmlFor="avatar-zoom"
          >
            <span>Zoom</span>
            <Input
              className="flex-1"
              id="avatar-zoom"
              max="3"
              min="1"
              onChange={(event) => handleZoomChange(Number(event.target.value))}
              step="0.05"
              type="range"
              value={zoom}
            />
          </label>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!image || !imageUrl}
            onClick={handleCrop}
            type="button"
          >
            Use avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
