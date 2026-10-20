import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { Button } from "@training-ia/ui/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@training-ia/ui/components/ui/select";
import { Toggle } from "@training-ia/ui/components/ui/toggle";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
} from "lucide-react";



type EditorToolbarProps = {
  editor: Editor;
  disabled?: boolean;
};

export function EditorToolbar({
  editor,
  disabled = false,
}: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const blockType = state.heading1
    ? "h1"
    : state.heading2
      ? "h2"
      : "paragraph";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
      <Select
        value={blockType}
        disabled={disabled}
        onValueChange={(value) => {
          if (value === "paragraph") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .setHeading({
                level: value === "h1" ? 1 : 2,
              })
              .run();
          }
        }}
      >
        <SelectTrigger className="w-36" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Parágrafo</SelectItem>
          <SelectItem value="h1">Título 1</SelectItem>
          <SelectItem value="h2">Título 2</SelectItem>
        </SelectContent>
      </Select>

      <div className="mx-1 h-6 w-px bg-border" />

      <Toggle
        size="sm"
        aria-label="Negrito"
        pressed={state.bold}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleBold().run()
        }
      >
        <Bold className="size-4" />
      </Toggle>

      <Toggle
        size="sm"
        aria-label="Itálico"
        pressed={state.italic}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleItalic().run()
        }
      >
        <Italic className="size-4" />
      </Toggle>

      <Toggle
        size="sm"
        aria-label="Sublinhado"
        pressed={state.underline}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleUnderline().run()
        }
      >
        <Underline className="size-4" />
      </Toggle>

      <Toggle
        size="sm"
        aria-label="Tachado"
        pressed={state.strike}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleStrike().run()
        }
      >
        <Strikethrough className="size-4" />
      </Toggle>

      <div className="mx-1 h-6 w-px bg-border" />

      <Toggle
        size="sm"
        aria-label="Lista com marcadores"
        pressed={state.bulletList}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleBulletList().run()
        }
      >
        <List className="size-4" />
      </Toggle>

      <Toggle
        size="sm"
        aria-label="Lista numerada"
        pressed={state.orderedList}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrdered className="size-4" />
      </Toggle>

      <Toggle
        size="sm"
        aria-label="Citação"
        pressed={state.blockquote}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleBlockquote().run()
        }
      >
        <Quote className="size-4" />
      </Toggle>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Desfazer"
        disabled={disabled || !state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Refazer"
        disabled={disabled || !state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </Button>
    </div>
  );
}