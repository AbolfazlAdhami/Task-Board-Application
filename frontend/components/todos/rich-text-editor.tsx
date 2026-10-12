"use client";

import LinkExtension from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import type { TiptapDocument } from "../../lib/api/tiptap-document";

const extensions = [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false,
  }),
  LinkExtension.configure({
    autolink: false,
    linkOnPaste: false,
    openOnClick: false,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
    isAllowedUri: (value, { defaultValidate }) => {
      if (!defaultValidate(value)) return false;

      try {
        const url = new URL(value);
        return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname) && !url.username && !url.password;
      } catch {
        return false;
      }
    },
  }),
];

function ToolbarButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="min-w-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange }: { value: TiptapDocument; onChange: (value: TiptapDocument) => void }) {
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    editorProps: {
      attributes: {
        "aria-label": "شرح وظیفه",
        class:
          "min-h-36 px-4 py-3 text-sm leading-7 text-foreground outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6 [&_blockquote]:border-r-4 [&_blockquote]:border-primary/50 [&_blockquote]:pr-3 [&_a]:text-primary [&_a]:underline",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getJSON() as TiptapDocument);
    },
  });

  function addLink() {
    if (!editor) return;

    try {
      const url = new URL(linkValue.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href: url.toString(),
          target: "_blank",
          rel: "noopener noreferrer",
        })
        .run();

      setLinkValue("");
      setLinkError("");
    } catch {
      setLinkError("پیوند باید با http:// یا https:// شروع شود.");
    }
  }

  if (!editor) {
    return (
      <p role="status" className="p-4 text-sm  text-muted">
        در حال آماده‌سازی ویرایشگر…
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-sm">
      <div aria-label="ابزارهای قالب‌بندی" className="flex flex-wrap gap-2 border-b border-border bg-background p-3">
        <ToolbarButton label="پررنگ" pressed={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>BOLD</strong>
        </ToolbarButton>
        <ToolbarButton label="کج" pressed={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>italic</em>
        </ToolbarButton>
        <ToolbarButton label="عنوان" pressed={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="فهرست نشانه‌دار" pressed={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • فهرست
        </ToolbarButton>
        <ToolbarButton label="فهرست شماره‌دار" pressed={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          ۱. فهرست
        </ToolbarButton>
        <ToolbarButton label="نقل‌قول" pressed={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          نقل‌قول
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-start gap-2 border-t border-border p-3">
        <input
          aria-label="نشانی پیوند"
          type="url"
          dir="ltr"
          value={linkValue}
          onChange={(event) => setLinkValue(event.target.value)}
          placeholder="https://example.com"
          className="min-w-48 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={addLink}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          افزودن پیوند به متن انتخاب‌شده
        </button>
        {linkError && (
          <p role="alert" className="w-full text-xs text-danger">
            {linkError}
          </p>
        )}
      </div>
    </div>
  );
}

export function RichTextPreview({ value }: { value: TiptapDocument }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    editable: false,
  });

  if (!editor) return null;

  return (
    <div className="wrap-break-word text-sm leading-6 text-muted [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_blockquote]:border-r-2 [&_blockquote]:border-primary/50 [&_blockquote]:pr-3 [&_a]:text-primary [&_a]:underline">
      <EditorContent editor={editor} />
    </div>
  );
}
