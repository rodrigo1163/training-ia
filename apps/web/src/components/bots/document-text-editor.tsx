import { useEffect, useId, useRef } from "react";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ScrollArea } from "@training-ia/ui/components/ui/scroll-area";

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

  // console.log(markdown)

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
    onCreate: ({ editor }) => {
  console.log("Markdown original:", JSON.stringify(markdown));
  console.log("Tiptap JSON:", editor.getJSON());
  console.log("Tiptap HTML:", editor.getHTML());
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
        <ScrollArea className="min-h-0 flex-1 bg-muted/20 px-4 py-3">
        <EditorContent
  editor={editor}
  className="
    [&_.tiptap_h1]:text-3xl
    [&_.tiptap_h1]:font-bold
    [&_.tiptap_h1]:mb-6

    [&_.tiptap_h2]:text-2xl
    [&_.tiptap_h2]:font-semibold
    [&_.tiptap_h2]:mt-8
    [&_.tiptap_h2]:mb-4

    [&_.tiptap_h3]:text-xl
    [&_.tiptap_h3]:font-semibold
    [&_.tiptap_h3]:mt-6
    [&_.tiptap_h3]:mb-3

    [&_.tiptap_p]:my-3

    [&_.tiptap_ul]:list-disc
    [&_.tiptap_ul]:pl-6
    [&_.tiptap_ul]:my-4

    [&_.tiptap_ol]:list-decimal
    [&_.tiptap_ol]:pl-6

    [&_.tiptap_li]:my-1
  "
  />
        </ScrollArea>
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
