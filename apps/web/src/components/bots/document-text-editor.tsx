import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
  parseTiptapDocument,
  type TiptapDocument,
} from "@/lib/tiptap-content";

type DocumentTextEditorProps = {
  content: TiptapDocument;
  hasEmptyTextError: boolean;
  isSaving: boolean;
  onChange: (content: TiptapDocument, text: string) => void;
};

export function DocumentTextEditor({
  content,
  hasEmptyTextError,
  isSaving,
  onChange,
}: DocumentTextEditorProps) {
  const editor = useEditor({
    content: content as never,
    editable: !isSaving,
    extensions: [StarterKit],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const nextContent = parseTiptapDocument(currentEditor.getJSON());

      if (nextContent) {
        onChange(
          nextContent,
          currentEditor.getText({ blockSeparator: "\n\n" }),
        );
      }
    },
  });

  useEffect(() => {
    if (!editor || JSON.stringify(editor.getJSON()) === JSON.stringify(content)) {
      return;
    }

    editor.commands.setContent(content as never, { emitUpdate: false });
  }, [content, editor]);

  return (
    <div className="mb-4 flex h-[min(65vh,calc(100dvh-22rem))] min-h-0 flex-col sm:h-[min(65vh,calc(100dvh-26rem))]">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/20 px-4 py-3">
        <EditorContent
          aria-label="Document text"
          className="prose prose-sm max-w-none leading-6 outline-none [&_.ProseMirror]:min-h-[20rem] [&_.ProseMirror]:outline-none"
          editor={editor}
        />
      </div>
      {hasEmptyTextError && (
        <p className="mt-2 border-t px-4 py-2 text-sm text-destructive">
          The document text cannot be empty.
        </p>
      )}
    </div>
  );
}
