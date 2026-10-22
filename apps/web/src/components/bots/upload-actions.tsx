import {
  FileTextIcon,
  FileUpIcon,
  GlobeIcon,
  PlusIcon,
  TypeIcon,
} from "lucide-react";
import { PdfFileUpload } from "@/components/bots/pdf-file-upload";
import { DocxFileUpload } from "@/components/bots/docx-file-upload";
import { TextUpload } from "@/components/bots/text-upload";
import { TxtFileUpload } from "@/components/bots/txt-file-upload";
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
    "pdf" | "docx" | "txt" | "text" | "website" | null
  >(null);

  function selectUpload(type: "pdf" | "docx" | "txt" | "text" | "website") {
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
                onClick={() => selectUpload("pdf")}
                type="button"
                variant="outline"
              >
                <FileUpIcon className="size-4 opacity-60" />
                PDF upload
              </Button>
              <Button
                onClick={() => selectUpload("docx")}
                type="button"
                variant="outline"
              >
                <FileTextIcon className="size-4 opacity-60" />
                DOCX upload
              </Button>
              <Button
                onClick={() => selectUpload("txt")}
                type="button"
                variant="outline"
              >
                <FileTextIcon className="size-4 opacity-60" />
                TXT upload
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
      <PdfFileUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "pdf"}
        orgSlug={orgSlug}
      />
      <TxtFileUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "txt"}
        orgSlug={orgSlug}
      />
      <DocxFileUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "docx"}
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
