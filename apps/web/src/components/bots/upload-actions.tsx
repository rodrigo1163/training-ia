import { FileUpIcon, GlobeIcon, PlusIcon, TypeIcon } from "lucide-react";
import { FileUpload } from "@/components/bots/file-upload";
import { TextUpload } from "@/components/bots/text-upload";
import { WebsiteUpload } from "@/components/bots/website-upload";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger,
} from "@/components/animate-ui/components/base/popover";
import { useState } from "react";

export function UploadActions({
  orgSlug,
  botSlug,
}: {
  orgSlug: string;
  botSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeUpload, setActiveUpload] = useState<
    "file" | "text" | "website" | null
  >(null);

  function selectUpload(type: "file" | "text" | "website") {
    setActiveUpload(type);
    setOpen(false);
  }

  return (
    <>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              className="bg-foreground text-background hover:bg-foreground/90"
              type="button"
            >
              <PlusIcon className="size-4" />
              Add document
            </Button>
          }
        />
        <PopoverPanel align="end" className="w-64">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Choose the upload type</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => selectUpload("file")}
                type="button"
                variant="outline"
              >
                <FileUpIcon className="size-4 opacity-60" />
                File upload
              </Button>
              <Button
                onClick={() => selectUpload("text")}
                type="button"
                variant="outline"
              >
                <TypeIcon className="size-4 opacity-60" />
                Text upload
              </Button>
              <Button
                onClick={() => selectUpload("website")}
                type="button"
                variant="outline"
              >
                <GlobeIcon className="size-4 opacity-60" />
                Website upload
              </Button>
            </div>
          </div>
        </PopoverPanel>
      </Popover>
      <FileUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "file"}
        orgSlug={orgSlug}
      />
      <TextUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "text"}
        orgSlug={orgSlug}
      />
      <WebsiteUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "website"}
        orgSlug={orgSlug}
      />
    </>
  );
}
