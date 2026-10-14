import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type DocumentTextEditorProps = {
  isSaving: boolean;
  onSave: (text: string) => void;
  text: string;
};

export function DocumentTextEditor({
  isSaving,
  onSave,
  text,
}: DocumentTextEditorProps) {
  const [editedText, setEditedText] = useState(text);
  const [isDirty, setIsDirty] = useState(false);
  const [hasEmptyTextError, setHasEmptyTextError] = useState(false);

  useEffect(() => {
    if (!isSaving) {
      setEditedText(text);
      setIsDirty(false);
      setHasEmptyTextError(false);
    }
  }, [isSaving, text]);

  function handleSave() {
    if (editedText.trim().length === 0) {
      setHasEmptyTextError(true);
      return;
    }

    onSave(editedText);
  }

  return (
    <div className="mb-4 flex h-[min(65vh,calc(100dvh-22rem))] min-h-0 flex-col sm:h-[min(65vh,calc(100dvh-26rem))]">
      <ScrollArea className="min-h-0 flex-1 rounded-lg border bg-muted/20">
        <Textarea
          aria-label="Document text"
          className="h-full min-h-full resize-none rounded-none border-0 bg-transparent px-4 py-4 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-sm"
          disabled={isSaving}
          onChange={(event) => {
            setEditedText(event.target.value);
            setIsDirty(event.target.value !== text);
            setHasEmptyTextError(false);
          }}
          value={editedText}
        />
      </ScrollArea>
      <Button
        className="mt-2 w-full shrink-0 rounded-md"
        disabled={!isDirty || isSaving}
        onClick={handleSave}
        type="button"
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
      {hasEmptyTextError && (
        <p className="border-t px-4 py-2 text-sm text-destructive">
          The document text cannot be empty.
        </p>
      )}
    </div>
  );
}
