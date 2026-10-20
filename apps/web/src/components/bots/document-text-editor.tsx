import { useEffect, useId, useRef } from "react";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type DocumentTextEditorProps = {
  hasEmptyTextError: boolean;
  isSaving: boolean;
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
};

const extensions = [StarterKit, Markdown];

export function DocumentTextEditor({
  hasEmptyTextError,
  isSaving,
  markdown,
  onChange,
  readOnly = false,
}: DocumentTextEditorProps) {
  const errorId = useId();
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const editor = useEditor({
    content: markdown,
    contentType: "markdown",
    editable: !readOnly && !isSaving,
    immediatelyRender: false,
    extensions,
    editorProps: {
      attributes: {
        "aria-describedby": hasEmptyTextError ? errorId : "",
        "aria-invalid": String(hasEmptyTextError),
        "aria-label": readOnly ? "Document Markdown preview" : "Document Markdown",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current(currentEditor.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor || editor.getMarkdown() === markdown) {
      return;
    }

    editor.commands.setContent(markdown, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, markdown]);

  useEffect(() => {
    editor?.setEditable(!readOnly && !isSaving, false);
  }, [editor, isSaving, readOnly]);

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          "aria-describedby": hasEmptyTextError ? errorId : "",
          "aria-invalid": String(hasEmptyTextError),
          "aria-label": readOnly ? "Document Markdown preview" : "Document Markdown",
        },
      },
    });
  }, [editor, errorId, hasEmptyTextError, readOnly]);

  return (
    <div className="mb-4 flex h-[min(65vh,calc(100dvh-22rem))] min-h-0 flex-col sm:h-[min(65vh,calc(100dvh-26rem))]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20 px-4 py-3">
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-3">
          <EditorContent
            className="prose prose-sm max-w-none break-words leading-6 dark:prose-invert [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_pre]:overflow-x-auto"
            editor={editor}
          />
        </div>
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
