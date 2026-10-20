import { useId } from "react";

type DocumentTextEditorProps = {
  hasEmptyTextError: boolean;
  isSaving: boolean;
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
};

export function DocumentTextEditor({
  hasEmptyTextError,
  isSaving,
  markdown,
  onChange,
  readOnly = false,
}: DocumentTextEditorProps) {
  const errorId = useId();

  return (
    <div className="mb-4 flex h-[min(65vh,calc(100dvh-22rem))] min-h-0 flex-col sm:h-[min(65vh,calc(100dvh-26rem))]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20 px-4 py-3">
        <textarea
          aria-describedby={hasEmptyTextError ? errorId : undefined}
          aria-invalid={hasEmptyTextError}
          aria-label="Document Markdown"
          className="min-h-0 flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 font-mono text-sm leading-6 outline-none"
          disabled={isSaving}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          value={markdown}
        />
      </div>

      {hasEmptyTextError && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 border-t px-4 py-2 text-sm text-destructive"
        >
          The document Markdown cannot be empty.
        </p>
      )}
    </div>
  );
}
