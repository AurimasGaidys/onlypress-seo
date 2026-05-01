// src/components/EditorToolbar.tsx
'use client';

import { type Editor } from '@tiptap/react';
import { useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Pilcrow,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Undo, Redo,
  ChevronDown,
  Download,
  Image as ImageIcon,
  Upload,
  Loader2,
  Link as LinkIcon,
  Unlink,
  Table,
  Columns,
  Rows,
  Trash2,
  Merge,
  Split,
  ToggleLeft,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Grid2x2
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { generateDocumentZip } from '@/lib/zip-generator';
import type { ArticleDocument } from '@/types/document';
import { LinkInsertionModal } from '@/components/editor/LinkInsertionModal';

interface EditorToolbarProps {
  editor: Editor | null;
  document: ArticleDocument;
  onSave?: () => void;
  onFileImport?: () => void;
}

export default function EditorToolbar({ editor, document: doc, onFileImport }: EditorToolbarProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  if (!editor) {
    return null;
  }


  const handleImageUpload = () => {
    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !user) return;

      toast.info('Uploading image...');
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${user.uid}/${Date.now()}-${file.name}`);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        editor.chain().focus().setImage({ src: downloadURL }).run();
        toast.success('Image uploaded and inserted successfully!');
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image.");
      }
    };
    input.click();
  };

  const handleDownload = async () => {
    if (!editor || isDownloading) return;
    setIsDownloading(true);
    try {
      await generateDocumentZip({
        title: doc?.title || 'Article Title',
        htmlContent: editor.getHTML(),
        featuredImageUrl: doc?.metadata?.featuredImage || undefined,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download ZIP file.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="border-b border-border flex flex-wrap items-center gap-1 p-2">
      {/* Undo/Redo Group */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-8" />

      {/* Heading Styles Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-32 justify-between">
            {
              editor.isActive('heading', { level: 1 }) ? <div className="flex items-center gap-2"><Heading1 className="h-4 w-4" /><span>Heading 1</span></div> :
                editor.isActive('heading', { level: 2 }) ? <div className="flex items-center gap-2"><Heading2 className="h-4 w-4" /><span>Heading 2</span></div> :
                  editor.isActive('heading', { level: 3 }) ? <div className="flex items-center gap-2"><Heading3 className="h-4 w-4" /><span>Heading 3</span></div> :
                    <div className="flex items-center gap-2"><Pilcrow className="h-4 w-4" /><span>Paragraph</span></div>
            }
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
            <Pilcrow className="h-4 w-4 mr-2" /> Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4 mr-2" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4 mr-2" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4 mr-2" /> Heading 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="h-8" />

      {/* Basic Formatting Group */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
      </div>
      <Separator orientation="vertical" className="h-8" />

      {/* Link Group */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLinkModalOpen(true)}
          className={editor.isActive('link') ? 'bg-accent' : ''}
          aria-label="Add link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          aria-label="Remove link"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Insertion Modal */}
      <LinkInsertionModal
        editor={editor}
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
      />
      <Separator orientation="vertical" className="h-8" />

      {/* List Group */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>
      <Separator orientation="vertical" className="h-8" />

      {/* Alignment Group */}
      <div className="flex items-center gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle

          size="sm"
          pressed={editor.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
      </div>
      <Separator orientation="vertical" className="h-8" />

      {/* Media Group */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
          aria-label="Upload Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        {onFileImport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileImport}
            aria-label="Import File"
          >
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator orientation="vertical" className="h-8" />

      {/* Table Group */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <Table className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <Grid2x2 className="h-4 w-4 mr-2" /> Insert table
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete table
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
            <Columns className="h-4 w-4 mr-2" /> Add column before
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns className="h-4 w-4 mr-2" /> Add column after
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete column
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
            <Rows className="h-4 w-4 mr-2" /> Add row before
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows className="h-4 w-4 mr-2" /> Add row after
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete row
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
            <Merge className="h-4 w-4 mr-2" /> Merge cells
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
            <Split className="h-4 w-4 mr-2" /> Split cell
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().mergeOrSplit().run()}>
            <Merge className="h-4 w-4 mr-2" /> Merge or split
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
            <ToggleLeft className="h-4 w-4 mr-2" /> Toggle header column
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
            <ToggleLeft className="h-4 w-4 mr-2" /> Toggle header row
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderCell().run()}>
            <ToggleLeft className="h-4 w-4 mr-2" /> Toggle header cell
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().setCellAttribute('colspan', 2).run()}>
            <Wrench className="h-4 w-4 mr-2" /> Set cell attribute
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().fixTables().run()}>
            <Wrench className="h-4 w-4 mr-2" /> Fix tables
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().goToNextCell().run()}>
            <ArrowRight className="h-4 w-4 mr-2" /> Go to next cell
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().goToPreviousCell().run()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go to previous cell
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Button */}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download ZIP
        </Button>
      </div>
    </div>
  );
}
