// src/lib/html-manipulator.ts
import * as cheerio from 'cheerio';

/**
 * Pakeičia bloko turinį HTML dokumente pagal jo ID.
 */
export function replaceBlockInHtml(html: string, blockId: string, newHtml: string): string {
  const $ = cheerio.load(html); // loads as fragment
  const block = $(`[data-block-id="${blockId}"]`);

  if (block.length > 0) {
    block.replaceWith(newHtml);
  } else {
    console.warn(`[HTML Manipulator] Block with ID "${blockId}" not found for replacement.`);
  }
  return $('body').html() || '';
}

/**
 * Įterpia naują HTML bloką po nurodyto bloko.
 */
export function insertBlockAfterInHtml(html: string, targetBlockId: string | null, newHtml: string): string {
  const $ = cheerio.load(html);
  
  if (targetBlockId) {
    const targetBlock = $(`[data-block-id="${targetBlockId}"]`);
    if (targetBlock.length > 0) {
      targetBlock.after(newHtml);
    } else {
      console.warn(`[HTML Manipulator] Target block with ID "${targetBlockId}" not found. Appending to end.`);
      $('body').append(newHtml);
    }
  } else {
    $('body').append(newHtml); // Įterpiame į pabaigą, jei targetBlockId yra null
  }
  return $('body').html() || '';
}

/**
 * Ištrina blokus iš HTML dokumento pagal jų ID.
 */
export function deleteBlocksInHtml(html: string, blockIds: string[]): string {
  const $ = cheerio.load(html);
  
  blockIds.forEach(id => {
    const block = $(`[data-block-id="${id}"]`);
    if (block.length > 0) {
      block.remove();
    } else {
      console.warn(`[HTML Manipulator] Block with ID "${id}" not found for deletion.`);
    }
  });
  return $('body').html() || '';
}
