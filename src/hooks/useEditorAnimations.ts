import { useState } from 'react';
import { type Editor as EditorInstance } from '@tiptap/react';
import { toast } from 'sonner';
import { DOMParser, type Node as ProseMirrorNode } from 'prosemirror-model';
import { ArticleDocument } from '@/types/document';

interface UseEditorAnimationsOptions {
  editorInstance: EditorInstance | null;
}

export const useEditorAnimations = ({ editorInstance }: UseEditorAnimationsOptions) => {
  const [animatingBlockId, setAnimatingBlockId] = useState<string | null>(null);

  /**
   * Animates typing text into an existing empty block, then finalizes with proper HTML.
   * Resolves the Promise only after full animation and HTML replacement is complete.
   */
  const animateTypingInBlock = (blockId: string, newHtml: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (!editorInstance) throw new Error("Editor not available.");

        const { state, view } = editorInstance;
        let nodePos: number | undefined;

        state.doc.descendants((node: ProseMirrorNode, pos: number) => {
          if (node.attrs['data-block-id'] === blockId) {
            nodePos = pos;
            return false;
          }
        });

        if (nodePos === undefined) throw new Error(`Block ${blockId} not found for typing.`);

        const tempDiv = globalThis.document.createElement('div');
        tempDiv.innerHTML = newHtml;
        const plainText = tempDiv.textContent || "";

        const typingSpeed = 80;
        let startTime: number | null = null;
        let currentText = "";

        const type = (timestamp: number) => {
          try {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            const charsToShow = Math.floor(elapsedTime / (1000 / typingSpeed));

            if (currentText.length < charsToShow && charsToShow <= plainText.length) {
              const textToAdd = plainText.substring(currentText.length, charsToShow);
              currentText += textToAdd;
              const insertTr = editorInstance.state.tr.insertText(textToAdd, nodePos! + 1 + currentText.length - textToAdd.length);
              view.dispatch(insertTr);
            }

            if (currentText.length < plainText.length) {
              requestAnimationFrame(type);
            } else {
              // Animation complete, apply final HTML replacement
              const finalTr = editorInstance.state.tr;
              let finalNodePos: number | undefined;
              let finalNodeSize: number | undefined;

              finalTr.doc.descendants((node: ProseMirrorNode, pos: number) => {
                if (node.attrs['data-block-id'] === blockId) {
                  finalNodePos = pos;
                  finalNodeSize = node.nodeSize;
                  return false;
                }
              });

              if (finalNodePos !== undefined && finalNodeSize !== undefined) {
                const parsedContent = DOMParser.fromSchema(state.schema).parse(tempDiv).content;
                finalTr.replaceWith(finalNodePos, finalNodePos + finalNodeSize, parsedContent);
                view.dispatch(finalTr);
              }
              resolve();
            }
          } catch (animError) {
            console.error("Typing animation frame error:", animError);
            resolve();
          }
        };
        requestAnimationFrame(type);
      } catch (error) {
        console.error("Error in animateTypingInBlock:", error);
        resolve();
      }
    });
  };

  /**
   * Completely replaces a block with animation: clears content, animates typing, then finalizes HTML.
   * Resolves only after full replacement and save operations are complete.
   */
  const animateBlockReplacement = (
    blockId: string,
    newHtml: string,
    document: ArticleDocument | null,
    onSaveComplete?: (updatedContent: string) => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      // Set animation lock
      setAnimatingBlockId(blockId);

      try {
        if (!editorInstance) throw new Error("Editor instance not available.");

        const { state, view } = editorInstance;
        let nodePos: number | undefined;
        let nodeSize: number | undefined;

        // Find block position
        state.doc.descendants((node: ProseMirrorNode, pos: number) => {
          if (node.attrs['data-block-id'] === blockId) {
            nodePos = pos;
            nodeSize = node.nodeSize;
            return false;
          }
        });

        if (nodePos === undefined || nodeSize === undefined) {
          throw new Error(`Block with ID ${blockId} not found.`);
        }

        // Clear block content and add animation class
        const { tr } = state;
        if (nodeSize > 2) { // Check if block is not empty
          tr.delete(nodePos + 1, nodePos + nodeSize - 2);
        }
        tr.setNodeMarkup(nodePos, undefined, { ...state.doc.nodeAt(nodePos)!.attrs, class: 'ai-writing-target' });
        view.dispatch(tr);

        // Extract plain text for animation
        const tempDiv = globalThis.document.createElement('div');
        tempDiv.innerHTML = newHtml;
        const plainText = tempDiv.textContent || "";

        // Typing animation with requestAnimationFrame
        const typingSpeed = 80;
        let startTime: number | null = null;
        let currentText = "";

        const type = (timestamp: number) => {
          try {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            const charsToShow = Math.floor(elapsedTime / (1000 / typingSpeed));

            if (currentText.length < charsToShow && charsToShow <= plainText.length) {
              const textToAdd = plainText.substring(currentText.length, charsToShow);
              currentText += textToAdd;

              const insertTr = editorInstance.state.tr.insertText(textToAdd, nodePos! + 1 + currentText.length - textToAdd.length);
              editorInstance.view.dispatch(insertTr);
            }

            if (currentText.length < plainText.length) {
              requestAnimationFrame(type);
            } else {
              // Animation complete, finalize with full HTML
              const finalTr = editorInstance.state.tr;
              const parsedContent = DOMParser.fromSchema(state.schema).parse(tempDiv).content;

              // Re-find block position as it may have changed
              let finalNodePos: number | undefined;
              let finalNodeSize: number | undefined;
              editorInstance.state.doc.descendants((node: ProseMirrorNode, pos: number) => {
                if (node.attrs['data-block-id'] === blockId) {
                  finalNodePos = pos;
                  finalNodeSize = node.nodeSize;
                  return false;
                }
              });

              if (finalNodePos !== undefined && finalNodeSize !== undefined) {
                finalTr.replaceWith(finalNodePos, finalNodePos + finalNodeSize, parsedContent);
                editorInstance.view.dispatch(finalTr);
              }

              // Handle save and notifications
              const updatedContent = editorInstance.getHTML();
              if (onSaveComplete) {
                onSaveComplete(updatedContent);
              } else {
                // Default save logic
                toast.success("Block updated.");
              }

              resolve();
            }
          } catch (animError) {
            console.error("Error during animation frame:", animError);
            resolve();
          }
        };

        requestAnimationFrame(type);

      } catch (error) {
        console.error("Error preparing animation:", error);
        toast.error("Animation failed", { description: error instanceof Error ? error.message : "Unknown error" });
        resolve();
      } finally {
        // Release animation lock with small delay for UI update
        setTimeout(() => {
          setAnimatingBlockId(null);
        }, 100);
      }
    });
  };

  /**
   * Executes sequential block replacement for multiple blocks with animation pauses.
   * Properly manages editor editable state throughout the process.
   */
  const animateMultipleBlocksReplacement = async (
    edits: Array<{ blockId: string; newHtml: string }>,
    document: ArticleDocument | null,
    onSaveComplete?: (updatedContent: string) => void
  ): Promise<void> => {
    if (!editorInstance) return;

    // Lock editor to prevent user interference
    editorInstance.setEditable(false);

    try {
      // Iterate through each edit operation sequentially
      for (const edit of edits) {
        // Find block position for each iteration (positions may change)
        let nodePos: number | undefined;
        let nodeSize: number | undefined;
        editorInstance.state.doc.descendants((node: ProseMirrorNode, pos: number) => {
          if (node.attrs['data-block-id'] === edit.blockId) {
            nodePos = pos;
            nodeSize = node.nodeSize;
            return false;
          }
        });

        if (nodePos === undefined || nodeSize === undefined) {
          console.warn(`Block ${edit.blockId} not found, skipping.`);
          continue;
        }

        // Clear only this block's content
        const tr = editorInstance.state.tr;
        if (nodeSize > 2) { // Check if block is not empty
          tr.delete(nodePos + 1, nodePos + nodeSize - 2);
        }
        tr.setNodeMarkup(nodePos, undefined, { ...editorInstance.state.doc.nodeAt(nodePos)!.attrs, class: 'ai-writing-target' });
        editorInstance.view.dispatch(tr);

        // Wait for typing animation to complete
        await animateTypingInBlock(edit.blockId, edit.newHtml);

        // Short pause between animations
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second pause
      }
    } catch (error) {
      console.error("Error during sequential block replacement:", error);
      toast.error("An error occurred while updating multiple blocks.");
    } finally {
      // Unlock editor when all operations complete
      editorInstance.setEditable(true);
      editorInstance.commands.focus('end');
    }
  };

  return {
    animatingBlockId,
    animateTypingInBlock,
    animateBlockReplacement,
    animateMultipleBlocksReplacement,
  };
};
