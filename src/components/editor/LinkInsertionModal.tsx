"use client"

import { useState } from "react"
import type { Editor } from "@tiptap/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface LinkInsertionModalProps {
  editor: Editor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkInsertionModal({ editor, open, onOpenChange }: LinkInsertionModalProps) {
  // State for form fields
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [linkText, setLinkText] = useState("")

  // State for checkboxes
  const [newTab, setNewTab] = useState(false)
  const [doFollow, setDoFollow] = useState(true)
  const [noFollow, setNoFollow] = useState(false)
  const [sponsored, setSponsored] = useState(false)
  const [ugc, setUgc] = useState(false)

  // Initialize form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && editor) {
      // Get current link attributes if editing an existing link
      const previousUrl = editor.getAttributes('link').href || ""
      const previousTitle = editor.getAttributes('link').title || ""
      const previousRel = editor.getAttributes('link').rel || ""
      const previousTarget = editor.getAttributes('link').target || ""

      // Get selected text
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, '')

      setUrl(previousUrl)
      setTitle(previousTitle)
      setLinkText(selectedText)
      setNewTab(previousTarget === "_blank")
      setNoFollow(previousRel.includes("nofollow"))
      setSponsored(previousRel.includes("sponsored"))
      setUgc(previousRel.includes("ugc"))
    }
    onOpenChange(newOpen)
  }

  const handleSave = () => {
    if (!editor || !url) return

    // Build rel attribute
    const relParts = [
      doFollow && "dofollow",
      noFollow && "nofollow",
      sponsored && "sponsored",
      ugc && "ugc"
    ].filter(Boolean)
    const rel = relParts.length > 0 ? relParts.join(" ") : undefined

    // Build link attributes
    const linkAttributes: {
      href: string
      title?: string
      target?: string
      rel?: string
    } = {
      href: url,
    }

    if (title) {
      linkAttributes.title = title
    }

    if (newTab) {
      linkAttributes.target = "_blank"
      // Add rel="noopener noreferrer" for security when opening in new tab
      linkAttributes.rel = rel ? `${rel} noopener noreferrer` : "noopener noreferrer"
    } else if (rel) {
      linkAttributes.rel = rel
    }

    // If there's link text and it's different from selection, replace the selection
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '')

    if (linkText && linkText !== selectedText) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: 'text',
          text: linkText,
          marks: [{ type: 'link', attrs: linkAttributes }]
        })
        .run()
    } else {
      // Just update/set the link on existing selection
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink(linkAttributes)
        .run()
    }

    // Reset form and close
    setUrl("")
    setTitle("")
    setLinkText("")
    setNewTab(false)
    setNoFollow(false)
    setSponsored(false)
    setUgc(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Reset form
    setUrl("")
    setTitle("")
    setLinkText("")
    setNewTab(false)
    setNoFollow(false)
    setSponsored(false)
    setUgc(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Įveskite URL adresą</DialogTitle>
          <DialogDescription>
            Configure the link details and attributes below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* URL Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              URL
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3"
              placeholder="https://example.com"
            />
          </div>

          {/* Title Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Link title (optional)"
            />
          </div>

          {/* Link Text Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkText" className="text-right">
              Nuorodos tekstas
            </Label>
            <Input
              id="linkText"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="col-span-3"
              placeholder="Link text"
            />
          </div>

          {/* Checkboxes Area */}
          <div className="grid grid-cols-4 gap-4 mt-2">
            {/* Empty col to align with inputs */}
            <div className="col-span-1"></div>

            <div className="col-span-3 flex flex-col gap-3">

              {/* Open in new tab */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newTab"
                  checked={newTab}
                  onCheckedChange={(checked) => setNewTab(checked as boolean)}
                />
                <Label htmlFor="newTab" className="font-normal cursor-pointer">
                  Atidaryti nuorodą naujame skirtuke
                </Label>
              </div>

              {/* No Follow */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dofollow"
                  checked={doFollow}
                  onCheckedChange={(checked) => setDoFollow(checked as boolean)}
                />
                <Label htmlFor="dofollow" className="font-normal cursor-pointer">
                  Add <CodeBadge>rel=&quot;dofollow&quot;</CodeBadge> to link
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nofollow"
                  checked={noFollow}
                  onCheckedChange={(checked) => setNoFollow(checked as boolean)}
                />
                <Label htmlFor="nofollow" className="font-normal cursor-pointer">
                  Add <CodeBadge>rel=&quot;nofollow&quot;</CodeBadge> to link
                </Label>
              </div>

              {/* Sponsored */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sponsored"
                  checked={sponsored}
                  onCheckedChange={(checked) => setSponsored(checked as boolean)}
                />
                <Label htmlFor="sponsored" className="font-normal cursor-pointer">
                  Add <CodeBadge>rel=&quot;sponsored&quot;</CodeBadge> to link
                </Label>
              </div>

              {/* UGC */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ugc"
                  checked={ugc}
                  onCheckedChange={(checked) => setUgc(checked as boolean)}
                />
                <Label htmlFor="ugc" className="font-normal cursor-pointer">
                  Add <CodeBadge>rel=&quot;UGC&quot;</CodeBadge> to link
                </Label>
              </div>

            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={!url}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for the grey code highlight effect
function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm font-mono text-xs mx-1">
      {children}
    </span>
  )
}
