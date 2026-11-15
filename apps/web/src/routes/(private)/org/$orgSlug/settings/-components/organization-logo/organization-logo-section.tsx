import { AlertCircleIcon, ImagePlusIcon, UploadIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ButtonSpinner } from "@/components/button-spinner";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { FileWithPreview } from "@/types/file-upload";
import { toast } from "@training-ia/ui/components/ui/toast";
import { OrganizationAvatar } from "../../../-components/organization-avatar";
import {
  ORGANIZATION_LOGO_MAX_SIZE,
  useUploadOrganizationLogoMutation,
} from "../../-hooks/use-organization-settings";
import { AvatarCropDialog } from "./avatar-crop-dialog";

const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";

type OrganizationLogoSectionProps = {
  logo?: string | null;
  name: string;
  orgSlug: string;
};

export function OrganizationLogoSection({
  logo,
  name,
  orgSlug,
}: OrganizationLogoSectionProps) {
  const [logoUrl, setLogoUrl] = useState(logo ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadLogoMutation = useUploadOrganizationLogoMutation(orgSlug);

  useEffect(() => {
    setLogoUrl(logo ?? null);
  }, [logo]);

  const handleFilesAdded = useCallback((addedFiles: FileWithPreview[]) => {
    const selectedFile = addedFiles[0]?.file;
    if (selectedFile instanceof File) {
      setSelectedFile(selectedFile);
    }
  }, []);

  const [
    { errors, isDragging },
    {
      clearFiles,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
    },
  ] = useFileUpload({
    accept: LOGO_ACCEPT,
    maxFiles: 1,
    maxSize: ORGANIZATION_LOGO_MAX_SIZE,
    multiple: false,
    onFilesAdded: handleFilesAdded,
  });

  const isBusy = uploadLogoMutation.isPending || selectedFile !== null;

  function clearSelection() {
    clearFiles();
    setSelectedFile(null);
  }

  function handleCroppedLogo(file: File) {
    clearSelection();
    uploadLogoMutation.mutate(file, {
      onSuccess: (result) => {
        setLogoUrl(result.logoUrl);
        toast.add({ title: "Organization logo updated.", type: "success" });
      },
      onError: (error) => {
        toast.add({ title: error.message, type: "error" });
      },
    });
  }

  function handleLogoKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!isBusy) openFileDialog();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ImagePlusIcon className="size-4 text-muted-foreground" />
          Organization
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your organization logo.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0">
          <div
            aria-describedby="organization-logo-upload-help"
            aria-disabled={isBusy}
            aria-label="Change organization logo"
            className="group relative size-full cursor-pointer rounded-full outline-none ring-1 ring-border transition focus-visible:ring-2 focus-visible:ring-ring aria-disabled:pointer-events-none aria-disabled:cursor-wait aria-disabled:opacity-60 data-[dragging=true]:ring-4 data-[dragging=true]:ring-primary"
            data-dragging={isDragging || undefined}
            onClick={() => {
              if (!isBusy) openFileDialog();
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onKeyDown={handleLogoKeyDown}
            role="button"
            tabIndex={isBusy ? -1 : 0}
          >
            <OrganizationAvatar
              className="size-full rounded-full text-xl"
              image={logoUrl}
              name={name}
            />
            <span
              aria-hidden="true"
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white transition-opacity ${
                isDragging || uploadLogoMutation.isPending
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              {uploadLogoMutation.isPending ? (
                <ButtonSpinner />
              ) : (
                <UploadIcon className="size-5" />
              )}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Organization logo</p>
          <p
            className="mt-1 text-xs text-muted-foreground"
            id="organization-logo-upload-help"
          >
            Click the logo or drop an image onto it to change it. PNG, JPG or
            WebP up to 2 MB.
          </p>
        </div>

        <input
          {...getInputProps({
            "aria-label": "Upload organization logo",
            className: "sr-only",
            disabled: isBusy,
          })}
        />
      </div>

      {errors.length > 0 && (
        <div
          className="mt-2 flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      <AvatarCropDialog
        file={selectedFile}
        onCropped={handleCroppedLogo}
        onOpenChange={(open) => {
          if (!open) clearSelection();
        }}
        open={selectedFile !== null}
      />
    </section>
  );
}
