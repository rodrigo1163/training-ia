import { FileTextIcon, FileUpIcon, TypeIcon, UploadIcon } from "lucide-react";
import { PdfFileUpload } from "@/components/bots/pdf-file-upload";
import { TextUpload } from "@/components/bots/text-upload";
import { TxtFileUpload } from "@/components/bots/txt-file-upload";
import { Button } from "@/components/ui/button";
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
    "pdf" | "txt" | "text" | null
  >(null);

  function selectUpload(type: "pdf" | "txt" | "text") {
    setActiveUpload(type);
    setOpen(false);
  }

  return (
    <>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline">
              <UploadIcon className="size-4 opacity-60" />
              Uploadar dados
            </Button>
          }
        />
        <PopoverPanel align="end" className="w-64">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Escolha o tipo de upload</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => selectUpload("pdf")}
                type="button"
                variant="outline"
              >
                <FileUpIcon className="size-4 opacity-60" />
                Upload de PDF
              </Button>
              <Button
                onClick={() => selectUpload("txt")}
                type="button"
                variant="outline"
              >
                <FileTextIcon className="size-4 opacity-60" />
                Upload de TXT
              </Button>
              <Button
                onClick={() => selectUpload("text")}
                type="button"
                variant="outline"
              >
                <TypeIcon className="size-4 opacity-60" />
                Upload de texto
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
      <TextUpload
        botSlug={botSlug}
        hideTrigger
        onOpenChange={(nextOpen) => !nextOpen && setActiveUpload(null)}
        open={activeUpload === "text"}
        orgSlug={orgSlug}
      />
    </>
  );
}
