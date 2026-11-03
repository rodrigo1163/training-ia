import { useRef, useState } from "react";
import { BotIcon, Trash2Icon, UploadIcon } from "lucide-react";

import type { Bot } from "@/api/bots/types";
import { ButtonSpinner } from "@/components/button-spinner";
import {
  useRemoveBotAvatarMutation,
  useUploadBotAvatarMutation,
} from "@/hooks/use-bots";
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_FILE_SIZE,
  validateAvatarFile,
} from "../-helpers/avatar";
import { AvatarCropDialog } from "./avatar-crop-dialog";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@training-ia/ui/components/ui/avatar";
import { toast } from "@training-ia/ui/components/ui/toast";

export function ChatAvatarPicker({
  bot,
  botSlug,
  orgSlug,
}: {
  bot: Bot;
  botSlug: string;
  orgSlug: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadBotAvatarMutation(orgSlug, botSlug);
  const removeMutation = useRemoveBotAvatarMutation(orgSlug, botSlug);
  const isPending = uploadMutation.isPending || removeMutation.isPending;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    event.target.value = "";
    if (!nextFile) return;

    try {
      await validateAvatarFile(nextFile);
      setError(null);
      setFile(nextFile);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Unable to read this avatar.",
      );
    }
  }

  function handleCroppedAvatar(nextFile: File) {
    if (nextFile.size > AVATAR_MAX_FILE_SIZE) {
      setError("Avatar files must be at most 2 MB.");
      return;
    }
    setFile(null);
    setError(null);
    uploadMutation.mutate(nextFile, {
      onError: (mutationError) => setError(mutationError.message),
      onSuccess: () =>
        toast.add({ title: "Avatar updated successfully.", type: "success" }),
    });
  }

  function handleRemove() {
    removeMutation.mutate(undefined, {
      onError: (mutationError) => setError(mutationError.message),
      onSuccess: () =>
        toast.add({ title: "Avatar removed successfully.", type: "success" }),
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Optional PNG, JPG, JPEG, or WebP image up to 2 MB.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar className="size-16 border">
          <AvatarImage alt="" src={bot.style.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-xl">
            <BotIcon aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <input
            accept={AVATAR_ACCEPT}
            className="sr-only"
            onChange={(event) => void handleFileChange(event)}
            ref={inputRef}
            type="file"
          />
          <Button
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="outline"
          >
            <UploadIcon aria-hidden="true" />
            {isPending
              ? "Uploading..."
              : bot.style.avatarUrl
                ? "Replace avatar"
                : "Upload avatar"}
            {isPending && <ButtonSpinner />}
          </Button>
          {bot.style.avatarUrl && (
            <Button
              disabled={isPending}
              onClick={handleRemove}
              type="button"
              variant="ghost"
            >
              <Trash2Icon aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <AvatarCropDialog
        file={file}
        onCropped={handleCroppedAvatar}
        onOpenChange={(open) => {
          if (!open) setFile(null);
        }}
        open={file !== null}
      />
    </div>
  );
}
