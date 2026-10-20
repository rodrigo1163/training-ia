import { useEffect, useId, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { parseTiptapDocument, type TiptapDocument } from "@/lib/tiptap-content";
import { EditorToolbar } from "./editor-toolbar";

type DocumentTextEditorProps = {
  content: JSONContent;
  hasEmptyTextError: boolean;
  isSaving: boolean;
  onChange: (content: TiptapDocument, text: string) => void;
};

const extensions = [StarterKit];

export function DocumentTextEditor({
  content,
  hasEmptyTextError,
  isSaving,
  onChange,
}: DocumentTextEditorProps) {
  const errorId = useId();
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    editable: !isSaving,

    editorProps: {
      attributes: {
        "aria-label": "Document text",
      },
    },

    onUpdate: ({ editor }) => {
      const content = parseTiptapDocument(editor.getJSON());

      if (!content) return;

      const text = editor.getText({
        blockSeparator: "\n\n",
      });

      onChangeRef.current(content, text);
    },
  });

  // Sincroniza conteúdos recebidos externamente
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getJSON();

    if (JSON.stringify(currentContent) === JSON.stringify(content)) {
      return;
    }

    editor.commands.setContent(content, {
      emitUpdate: false,
    });
  }, [editor, content]);

  // Sincroniza o estado de edição
  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!isSaving, false);
  }, [editor, isSaving]);

  // Atualiza os atributos de acessibilidade
  useEffect(() => {
    if (!editor) return;

    editor.setOptions({
      editorProps: {
        attributes: {
          "aria-label": "Document text",
          "aria-invalid": String(hasEmptyTextError),
          "aria-describedby": hasEmptyTextError ? errorId : "",
        },
      },
    });
  }, [editor, hasEmptyTextError, errorId]);

  return (
    <div className="mb-4 flex h-[min(65vh,calc(100dvh-22rem))] min-h-0 flex-col sm:h-[min(65vh,calc(100dvh-26rem))]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20 px-4 py-3">
        {editor && (
          <div className="sticky top-0 z-10 shrink-0 bg-muted/20">
            <EditorToolbar
              editor={editor}
              disabled={isSaving}
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-3">
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none leading-6 [&_.ProseMirror]:min-h-[20rem] [&_.ProseMirror]:outline-none"
          />
        </div>
      </div>

      {hasEmptyTextError && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 border-t px-4 py-2 text-sm text-destructive"
        >
          The document text cannot be empty.
        </p>
      )}
    </div>
  );
}
