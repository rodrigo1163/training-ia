import { ImagePlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ButtonSpinner } from "@/components/button-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@training-ia/ui/components/ui/button";
import { toast } from "@training-ia/ui/components/ui/toast";
import { useUploadAccountAvatarMutation } from "../../-hooks/use-account-settings";

type ProfileSectionProps = {
  image?: string | null;
  name: string;
};

export function ProfileSection({ image, name }: ProfileSectionProps) {
  const [avatarUrl, setAvatarUrl] = useState(image ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = useUploadAccountAvatarMutation();

  useEffect(() => {
    setAvatarUrl(image ?? null);
  }, [image]);

  function onAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    uploadAvatarMutation.mutate(file, {
      onSuccess: (result) => {
        setAvatarUrl(result.imageUrl);
        toast.add({ title: "Avatar updated.", type: "success" });
      },
      onError: (error) => {
        toast.add({ title: error.message, type: "error" });
      },
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ImagePlusIcon className="size-4 text-muted-foreground" />
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile avatar.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <UserAvatar
            className="size-20 text-xl"
            image={avatarUrl}
            name={name}
          />
          <div>
            <p className="text-sm font-medium">Profile avatar</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG or WebP up to 2 MB.
            </p>
          </div>
        </div>
        <div className="sm:ml-auto">
          <input
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={onAvatarSelected}
            type="file"
          />
          <Button
            disabled={uploadAvatarMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            variant="outline"
          >
            {uploadAvatarMutation.isPending ? (
              <>
                Uploading...
                <ButtonSpinner />
              </>
            ) : (
              "Change avatar"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
