import { Extension } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { findParentNode } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BlockNodeView } from '../../components/editor/BlockNodeView';

// Define the attribute name for the block ID
const BlockIdAttributeName = 'data-block-id';

// Generate a unique block ID
const generateBlockId = (): string => `bl-${Math.random().toString(36).substr(2, 9)}`;

// Define the block-level nodes we want to target
const BLOCK_NODE_TYPES = [
  'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'codeBlock', 'image', 'table', 'tr', 'td', 'th'
];

const BlockExtension = Extension.create({
  name: 'blockExtension',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_NODE_TYPES,
        attributes: {
          [BlockIdAttributeName]: {
            default: null,
            parseHTML: (element) => element.getAttribute(BlockIdAttributeName),
            renderHTML: (attributes) => {
              if (!attributes[BlockIdAttributeName]) {
                return {};
              }
              return { [BlockIdAttributeName]: attributes[BlockIdAttributeName] };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockExtension'),
        appendTransaction: (transactions, oldState, newState) => {
          const tr = newState.tr;
          let modified = false;

        // Perbėgame per visus pakeistus diapazonus
          transactions.forEach(transaction => {
            if (!transaction.docChanged) return;

            transaction.steps.forEach(step => {
              try {
                step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
                  newState.doc.nodesBetween(newStart, newEnd, (node, pos) => {
                    // Apsaugos tikrinimas: ar node egzistuoja ir turi reikiamus atributus
                    if (!node || !node.type || !node.attrs) return;
                    // Tikriname tik tuos node'us, kurie priklauso mūsų sąrašui
                    if (BLOCK_NODE_TYPES.includes(node.type.name)) {
                      // Tikriname, ar node jau turi ID. Jei ne, arba jei ID tuščias - priskiriame naują.
                      if (!node.attrs[BlockIdAttributeName]) {
                        tr.setNodeAttribute(pos, BlockIdAttributeName, generateBlockId());
                        modified = true;
                      }
                    }
                  });
                });
              } catch (stepError) {
                console.warn('Error processing transaction step:', stepError);
              }
            });
          });

          return modified ? tr : null;
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },

  // Note: Custom commands should be added separately, not within the Extension.create() call
});

// Export a separate function for custom commands
export const blockCommands = {
  // Command to get the block at a specific position or the current selection
  getBlockAt: (pos?: number) => ({ editor }: { editor: { state: any; blockAtResult?: any } }) => {
    const state = editor.state;
    const resolvedPos = pos !== undefined ? state.doc.resolve(pos) : state.selection.$from;
    const node = resolvedPos.node(1); // Get the parent node (first level up from cursor)
    const nodePos = resolvedPos.start(1); // Get the start position of the parent node

    if (node && node.attrs[BlockIdAttributeName]) {
      // Store the result in editor storage
      editor.blockAtResult = {
        node,
        pos: nodePos,
        id: node.attrs[BlockIdAttributeName],
      };
      return true; // Command executed successfully
    }

    // If no block ID is found, try to find a parent block node with an ID
    const parentBlock = findParentNode(
      (node: Node) => BLOCK_NODE_TYPES.includes(node.type.name) && !!node.attrs[BlockIdAttributeName]
    )(state.selection);

    if (parentBlock) {
      editor.blockAtResult = {
        node: parentBlock.node,
        pos: parentBlock.pos,
        id: parentBlock.node.attrs[BlockIdAttributeName],
      };
      return true;
    }

    editor.blockAtResult = null;
    return true; // Command executed (even if no block found)
  },

  // Command to replace a block by its ID
  replaceBlockById: (id: string, newContent: string) => ({ editor }: { editor: { state: any; view: { dispatch: (tr: any) => void } } }) => {
    let found = false;
    const state = editor.state;
    const { doc, tr } = state;

    // Iterate through the document to find the node with the matching ID
    doc.descendants((node: Node, pos: number) => {
      if (found) return false; // Stop iterating once found

      if (node.attrs[BlockIdAttributeName] === id) {
        found = true;

        // Create a new node from the HTML content
        // This requires the editor instance to parse the HTML
        // We'll use DOMParser to convert the HTML string to DOM nodes, then ProseMirror's parser
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newContent;
        const domFragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          domFragment.appendChild(tempDiv.firstChild);
        }
        // Note: This is a simplified approach. In practice, you'd need to properly parse the HTML into ProseMirror nodes
        // For now, we'll just insert the HTML as a text node
        const textNode = state.schema.text(newContent);
        
        // Replace the content of the found node
        tr.replaceWith(pos, pos + node.nodeSize, textNode);

        // Ensure the selection is valid after the replacement
        if (tr.selection.from > tr.doc.nodeSize - 1) {
          tr.setSelection(state.selection.constructor.create(tr.doc, tr.doc.nodeSize - 1));
        }
        
        editor.view.dispatch(tr);
        return true; // Successfully replaced
      }
    });

    return found; // Return whether we found and replaced the block
  },
};

export default BlockExtension;
