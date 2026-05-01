import { useState, useCallback } from 'react';
import { type Editor as EditorInstance } from '@tiptap/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { DOMParser, Node as ProsemirrorNode } from 'prosemirror-model';
import { AiOperation } from '../types/ai-commands';
import { ArticleDocument } from '../types/document';

interface UseEditorUpdaterProps {
  editorInstance: EditorInstance | null;
  document?: ArticleDocument;
  isLocalSession?: boolean;
  onLocalContentChange?: (newContent: string) => void;
}

export const useEditorUpdater = ({
  editorInstance,
  document,
  isLocalSession = false,
  onLocalContentChange,
}: UseEditorUpdaterProps) => {
  const [animatingBlockId, setAnimatingBlockId] = useState<string | null>(null);
  const [isReplacingArticle, setIsReplacingArticle] = useState(false);

  const saveContent = useCallback(async (content: string) => {
    if (isLocalSession) {
      onLocalContentChange?.(content);
    } else if (document?.id) {
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, { content, lastEdited: serverTimestamp() });
    }
  }, [document, isLocalSession, onLocalContentChange]);

  const animateTypingInBlock = useCallback((blockId: string, newHtml: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (!editorInstance) throw new Error("Editor not available.");

        const { state, view } = editorInstance;
        let nodePos: number | undefined;

        state.doc.descendants((node: ProsemirrorNode, pos: number) => {
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
              const finalTr = editorInstance.state.tr;
              let finalNodePos: number | undefined, finalNodeSize: number | undefined;

              finalTr.doc.descendants((node: ProsemirrorNode, pos: number) => {
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
  }, [editorInstance]);

  const animateBlockReplacement = useCallback((blockId: string, newHtml: string): Promise<void> => {
    return new Promise((resolve) => {
        setAnimatingBlockId(blockId);
        try {
          if (!editorInstance) throw new Error("Editor not available.");

          const { state, view } = editorInstance;
          let nodePos: number | undefined, nodeSize: number | undefined;

          state.doc.descendants((node: ProsemirrorNode, pos: number) => {
            if (node.attrs['data-block-id'] === blockId) {
              nodePos = pos;
              nodeSize = node.nodeSize;
              return false;
            }
          });

          if (nodePos === undefined || nodeSize === undefined) throw new Error(`Block ${blockId} not found.`);

          const { tr } = state;
          tr.delete(nodePos + 1, nodePos + nodeSize - 2);
          tr.setNodeMarkup(nodePos, undefined, { ...state.doc.nodeAt(nodePos)!.attrs, class: 'ai-writing-target' });
          view.dispatch(tr);

          const tempDiv = globalThis.document.createElement('div');
          tempDiv.innerHTML = newHtml;
          const plainText = tempDiv.textContent || "";

          const typingSpeed = 80;
          let startTime: number | null = null;
          let currentText = "";

          const type = async (timestamp: number) => {
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
                const finalTr = editorInstance.state.tr;
                const parsedContent = DOMParser.fromSchema(state.schema).parse(tempDiv).content;

                let finalNodePos: number | undefined, finalNodeSize: number | undefined;
                editorInstance.state.doc.descendants((node: ProsemirrorNode, pos: number) => {
                  if (node.attrs['data-block-id'] === blockId) {
                      finalNodePos = pos;
                      finalNodeSize = node.nodeSize;
                      return false;
                  }
                });

                if (finalNodePos !== undefined && finalNodeSize !== undefined) {
                    finalTr.replaceWith(finalNodePos, finalNodePos + finalNodeSize, parsedContent);
                    view.dispatch(finalTr);
                }

                const updatedContent = editorInstance.getHTML();
                await saveContent(updatedContent);
                toast.success("Document saved.");
                resolve();
              }
            } catch (animError) {
              console.error("Error during animation frame:", animError);
              resolve();
            }
          };
          requestAnimationFrame(type);
        } catch (error) {
          toast.error("Animation failed", { description: error instanceof Error ? error.message : "Unknown error" });
          resolve();
        } finally {
          setTimeout(() => setAnimatingBlockId(null), 100);
        }
    });
  }, [editorInstance, saveContent]);

  const handleContentUpdate = useCallback(async (payload: string | AiOperation | AiOperation[]) => {
    if (!editorInstance) return;

    if (typeof payload === 'string') {
        editorInstance.commands.setContent(payload);
        await saveContent(payload);
        return;
    }

    if (animatingBlockId || isReplacingArticle) {
      toast.info("Please wait for the current AI edit to finish.");
      return;
    }

    const executeOperation = async (op: AiOperation) => {
        switch (op.command) {
            case 'REPLACE_BLOCK':
                await animateBlockReplacement(op.blockId, op.newHtml);
                break;
            case 'REPLACE_MULTIPLE_BLOCKS':
                editorInstance.setEditable(false);
                try {
                    for (const edit of op.edits) {
                        let nodePos: number | undefined, nodeSize: number | undefined;
                        editorInstance.state.doc.descendants((node: ProsemirrorNode, pos: number) => {
                            if (node.attrs['data-block-id'] === edit.blockId) {
                                nodePos = pos; nodeSize = node.nodeSize;
                                return false;
                            }
                        });
                        if (nodePos === undefined || nodeSize === undefined) continue;

                        const tr = editorInstance.state.tr;
                        if (nodeSize > 2) tr.delete(nodePos + 1, nodePos + nodeSize - 2);
                        tr.setNodeMarkup(nodePos, undefined, { ...editorInstance.state.doc.nodeAt(nodePos)!.attrs, class: 'ai-writing-target' });
                        editorInstance.view.dispatch(tr);

                        await animateTypingInBlock(edit.blockId, edit.newHtml);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } finally {
                    editorInstance.setEditable(true);
                }
                break;
            case 'REPLACE_ARTICLE_CONTENT':
                if (window.confirm("This action will replace the entire article. Continue?")) {
                    setIsReplacingArticle(true);
                    setTimeout(async () => {
                        editorInstance.commands.setContent(op.newFullHtml);
                        await saveContent(op.newFullHtml);
                        toast.success("Article content has been rewritten.");
                        setIsReplacingArticle(false);
                    }, 100);
                }
                break;
            case 'INSERT_BLOCK_AFTER': {
                const { state, view } = editorInstance;
                const { tr } = state;
                const { targetBlockId, newHtml } = op;
                const tempDiv = globalThis.document.createElement('div');
                tempDiv.innerHTML = newHtml.trim();
                const parsedContent = DOMParser.fromSchema(state.schema).parse(tempDiv).content;
                if (targetBlockId === 'DOCUMENT_END') {
                  tr.insert(state.doc.content.size, parsedContent);
                } else {
                  state.doc.descendants((node: ProsemirrorNode, pos: number) => {
                    if (node.attrs['data-block-id'] === targetBlockId) {
                      tr.insert(pos + node.nodeSize, parsedContent);
                      return false;
                    }
                  });
                }
                view.dispatch(tr);
                const updatedContent = editorInstance.getHTML();
                const docRef = doc(db, 'documents', document?.id || '');
                updateDoc(docRef, {
                  content: updatedContent,
                  lastEdited: serverTimestamp(),
                });
                break;
            }
            case 'INSERT_BLOCK_BEFORE': {
              const { state, view } = editorInstance;
              const { tr } = state;
              let changesMade = false;

              const { targetBlockId, newHtml } = op;
              const tempDiv = globalThis.document.createElement('div');
              tempDiv.innerHTML = newHtml.trim();
              const parsedContent = DOMParser.fromSchema(state.schema).parse(tempDiv).content;
              if (targetBlockId === 'DOCUMENT_START') {
                tr.insert(0, parsedContent);
                changesMade = true;
              } else {
                let nodeFound = false;
                state.doc.descendants((node: ProsemirrorNode, pos: number) => {
                  if (node.attrs['data-block-id'] === targetBlockId) {
                    nodeFound = true;
                    tr.insert(pos, parsedContent);
                    changesMade = true;
                    return false;
                  }
                });
                if (!nodeFound) toast.warning(`Target block ID ${targetBlockId} not found for insertion.`);
              }

              if (changesMade) {
                view.dispatch(tr);
                const updatedContent = editorInstance.getHTML();
                const docRef = doc(db, 'documents', document?.id || '');
                updateDoc(docRef, {
                  content: updatedContent,
                  lastEdited: serverTimestamp(),
                });
              }
              break;
            }
            case 'DELETE_BLOCKS': {
              const { state, view } = editorInstance;
              const { tr } = state;

              const { blockIds } = op;
              const positionsToDelete: { from: number; to: number }[] = [];
              state.doc.descendants((node: ProsemirrorNode, pos: number) => {
                if (blockIds.includes(node.attrs['data-block-id'])) {
                  positionsToDelete.push({ from: pos, to: pos + node.nodeSize });
                }
              });
              if (positionsToDelete.length > 0) {
                positionsToDelete.reverse().forEach(({ from, to }) => {
                  tr.delete(from, to);
                });
                view.dispatch(tr);

                const updatedContent = editorInstance.getHTML();
                const docRef = doc(db, 'documents', document?.id || '');
                updateDoc(docRef, {
                  content: updatedContent,
                  lastEdited: serverTimestamp(),
                });
              } else {
                toast.warning("No blocks found to delete.");
              }
              break;
            }
        }
    };

    if (Array.isArray(payload)) {
      for (const op of payload) {
        await executeOperation(op);
      }
    } else {
      await executeOperation(payload);
    }
  }, [editorInstance, animatingBlockId, isReplacingArticle, animateBlockReplacement, animateTypingInBlock, saveContent, document?.id]);

  return {
    handleContentUpdate,
    animatingBlockId,
    isReplacingArticle
  };
};
