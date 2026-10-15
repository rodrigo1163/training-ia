import { ScrollArea } from "@training-ia/ui/components/ui/scroll-area";
import { Textarea } from "@training-ia/ui/components/ui/textarea";

type DocumentTextEditorProps = {
  hasEmptyTextError: boolean;
  isSaving: boolean;
  onChange: (text: string) => void;
  text: string;
};

export function DocumentTextEditor({
  hasEmptyTextError,
  isSaving,
  onChange,
  text,
}: DocumentTextEditorProps) {
  return (
    <div className="mb-4 flex h-[min(65vh,calc(100dvh-22rem))] min-h-0 flex-col sm:h-[min(65vh,calc(100dvh-26rem))]">
      <ScrollArea className="min-h-0 flex-1 rounded-lg border bg-muted/20">
        <Textarea
          aria-label="Document text"
          className="h-full min-h-full resize-none rounded-none border-0 bg-transparent px-4 py-4 text-sm shadow-none leading-6 focus-visible:border-0 focus-visible:ring-0 md:text-sm"
          disabled={isSaving}
          onChange={(event) => onChange(event.target.value)}
          value={text}
        />
      </ScrollArea>
      {hasEmptyTextError && (
        <p className="mt-2 border-t px-4 py-2 text-sm text-destructive">
          The document text cannot be empty.
        </p>
      )}
    </div>
  );
}
