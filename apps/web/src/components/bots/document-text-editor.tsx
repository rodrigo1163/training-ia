import { useEffect, useId, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@training-ia/ui/components/ui/button";
import { ScrollArea } from "@training-ia/ui/components/ui/scroll-area";
import { Separator } from "@training-ia/ui/components/ui/separator";
import { Toggle } from "@training-ia/ui/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@training-ia/ui/components/ui/tooltip";

type DocumentTextEditorProps = {
  hasEmptyTextError: boolean;
  isSaving: boolean;
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
};

const extensions = [
  StarterKit,
  TableKit,
  Markdown.configure({
    markedOptions: { gfm: true },
  }),
];

type ToolbarToggleProps = {
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onToggle: () => void;
  pressed: boolean;
};

function ToolbarToggle({
  disabled,
  icon: Icon,
  label,
  onToggle,
  pressed,
}: ToolbarToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          aria-label={label}
          disabled={disabled}
          onClick={onToggle}
          onMouseDown={(event) => event.preventDefault()}
          pressed={pressed}
          size="sm"
          type="button"
          variant="outline"
        >
          <Icon aria-hidden="true" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type ToolbarButtonProps = {
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function ToolbarButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          onMouseDown={(event) => event.preventDefault()}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Icon aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function EditorToolbar({
  editor,
  isSaving,
}: {
  editor: Editor | null;
  isSaving: boolean;
}) {
  const disabled = !editor || isSaving;

  return (
    <TooltipProvider>
      <div
        aria-label="Text formatting toolbar"
        className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-2"
        role="toolbar"
      >
        <ToolbarToggle
          disabled={disabled}
          icon={BoldIcon}
          label="Bold"
          onToggle={() => editor?.chain().focus().toggleBold().run()}
          pressed={editor?.isActive("bold") ?? false}
        />
        <ToolbarToggle
          disabled={disabled}
          icon={ItalicIcon}
          label="Italic"
          onToggle={() => editor?.chain().focus().toggleItalic().run()}
          pressed={editor?.isActive("italic") ?? false}
        />
        <ToolbarToggle
          disabled={disabled}
          icon={StrikethroughIcon}
          label="Strikethrough"
          onToggle={() => editor?.chain().focus().toggleStrike().run()}
          pressed={editor?.isActive("strike") ?? false}
        />
        <ToolbarToggle
          disabled={disabled}
          icon={CodeIcon}
          label="Inline code"
          onToggle={() => editor?.chain().focus().toggleCode().run()}
          pressed={editor?.isActive("code") ?? false}
        />

        <Separator className="mx-1 h-5" orientation="vertical" />

        <ToolbarToggle
          disabled={disabled}
          icon={ListIcon}
          label="Bulleted list"
          onToggle={() => editor?.chain().focus().toggleBulletList().run()}
          pressed={editor?.isActive("bulletList") ?? false}
        />
        <ToolbarToggle
          disabled={disabled}
          icon={ListOrderedIcon}
          label="Numbered list"
          onToggle={() => editor?.chain().focus().toggleOrderedList().run()}
          pressed={editor?.isActive("orderedList") ?? false}
        />
        <ToolbarToggle
          disabled={disabled}
          icon={CodeIcon}
          label="Code block"
          onToggle={() => editor?.chain().focus().toggleCodeBlock().run()}
          pressed={editor?.isActive("codeBlock") ?? false}
        />

        <Separator className="mx-1 h-5" orientation="vertical" />

        <ToolbarButton
          disabled={disabled || !(editor?.can().undo() ?? false)}
          icon={Undo2Icon}
          label="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
        />
        <ToolbarButton
          disabled={disabled || !(editor?.can().redo() ?? false)}
          icon={Redo2Icon}
          label="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
        />
      </div>
    </TooltipProvider>
  );
}

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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20">
        {!readOnly && <EditorToolbar editor={editor} isSaving={isSaving} />}
        <ScrollArea className="min-h-0 flex-1 bg-muted/20 px-4 py-3">
          <EditorContent
            editor={editor}
            className="
              [&_.tiptap_h1]:mb-6
              [&_.tiptap_h1]:text-3xl
              [&_.tiptap_h1]:font-bold
              [&_.tiptap_h2]:mt-8
              [&_.tiptap_h2]:mb-4
              [&_.tiptap_h2]:text-2xl
              [&_.tiptap_h2]:font-semibold
              [&_.tiptap_h3]:mt-6
              [&_.tiptap_h3]:mb-3
              [&_.tiptap_h3]:text-xl
              [&_.tiptap_h3]:font-semibold
              [&_.tiptap_p]:my-4
              [&_.tiptap_ul]:my-4
              [&_.tiptap_ul]:list-disc
              [&_.tiptap_ul]:pl-6
              [&_.tiptap_ol]:list-decimal
              [&_.tiptap_ol]:pl-6
              [&_.tiptap_table]:w-full
              [&_.tiptap_table]:border-collapse
              [&_.tiptap_th]:border
              [&_.tiptap_th]:border-border
              [&_.tiptap_th]:bg-muted
              [&_.tiptap_th]:px-3
              [&_.tiptap_th]:py-2
              [&_.tiptap_th]:text-left
              [&_.tiptap_td]:border
              [&_.tiptap_td]:border-border
              [&_.tiptap_td]:px-3
              [&_.tiptap_td]:py-2
              [&_.tiptap_li]:my-1
              [&_.tiptap_pre]:my-4
              [&_.tiptap_pre]:overflow-x-auto
              [&_.tiptap_pre]:rounded-md
              [&_.tiptap_pre]:bg-muted
              [&_.tiptap_pre]:p-3
              [&_.tiptap]:outline-none
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
