import { useState } from "react";
import { GlobeIcon } from "lucide-react";

import { ButtonSpinner } from "@/components/button-spinner";
import { isValidWebsiteUrl } from "../-helpers/validation";
import { useUploadWebsiteMutation } from "@/hooks/use-upload";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@training-ia/ui/components/ui/dialog";
import { Input } from "@training-ia/ui/components/ui/input";
import { toast } from "@training-ia/ui/components/ui/toast";

export function WebsiteUpload({
  orgSlug,
  botSlug,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  orgSlug: string;
  botSlug: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const open = controlledOpen ?? internalOpen;

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const mutation = useUploadWebsiteMutation(orgSlug, botSlug);

  function handleSubmit() {
    if (!isValidWebsiteUrl(url)) {
      setValidationError(
        "Enter a valid URL starting with http:// or https://.",
      );
      return;
    }

    setValidationError(null);
    mutation.mutate(url.trim(), {
      onError: (error) => toast.add({ title: error.message, type: "error" }),
      onSuccess: () => {
        toast.add({ title: "Website extracted successfully.", type: "success" });
        setUrl("");
        setValidationError(null);
        setDialogOpen(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return;
    setDialogOpen(nextOpen);
    if (!nextOpen) {
      setUrl("");
      setValidationError(null);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            <GlobeIcon className="size-4 opacity-60" />
            Website upload
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Website upload</DialogTitle>
          <DialogDescription>
            Enter the website URL to extract the page's text content.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="website-url">
            Website URL
          </label>
          <Input
            aria-invalid={validationError ? true : undefined}
            autoFocus
            disabled={mutation.isPending}
            id="website-url"
            onChange={(event) => {
              setUrl(event.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="https://exemplo.com"
            type="url"
            value={url}
          />
          {validationError && (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!url.trim() || mutation.isPending}
            onClick={handleSubmit}
            type="button"
          >
            {mutation.isPending ? "Extraindo..." : "Extrair site"}
            {mutation.isPending && <ButtonSpinner />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
