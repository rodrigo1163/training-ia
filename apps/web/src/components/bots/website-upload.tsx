import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GlobeIcon } from "lucide-react";

import { botsQueryKey } from "@/components/bots/bots";
import { fetchDataQueryKey } from "@/components/bots/fetch-data";
import { env } from "@/env";
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

const API_URL = env.VITE_API_URL;

function isValidWebsiteUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function uploadWebsite(orgSlug: string, botSlug: string, url: string) {
  const response = await fetch(
    `${API_URL}/organization/${encodeURIComponent(orgSlug)}/bots/${encodeURIComponent(botSlug)}/upload-website-bot`,
    {
      body: JSON.stringify({ url }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to extract the website content.");
  }

  const payload = (await response.json()) as { documentId?: string };
  if (!payload.documentId) {
    throw new Error("The backend did not confirm the website extraction.");
  }
}

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
  const queryClient = useQueryClient();
  const open = controlledOpen ?? internalOpen;

  function setDialogOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const mutation = useMutation({
    mutationFn: () => uploadWebsite(orgSlug, botSlug, url.trim()),
    onError: (error) => toast.add({ title: error.message, type: "error" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchDataQueryKey(orgSlug, botSlug),
      });
      await queryClient.invalidateQueries({ queryKey: botsQueryKey(orgSlug) });
      toast.add({ title: "Website extracted successfully.", type: "success" });
      setUrl("");
      setValidationError(null);
      setDialogOpen(false);
    },
  });

  function handleSubmit() {
    if (!isValidWebsiteUrl(url)) {
      setValidationError(
        "Enter a valid URL starting with http:// or https://.",
      );
      return;
    }

    setValidationError(null);
    mutation.mutate();
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
