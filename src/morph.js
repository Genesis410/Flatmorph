import { NODE_SIZE, STATIC, SLOT_FLAGS, SLOT_SUBTREE_SIZE, SLOT_DATA, SLOT_DOM_INDEX } from './constants.js';
import { updateNode, createNode, checkHeap } from './dom.js';

/**
 * Iterative morph loop for FlatMorph.
 * Traverses the new arena and compares it with the old arena.
 * 
 * @param {Array|TypedArray} oldArena 
 * @param {Array|TypedArray} newArena 
 * @param {Array} oldAttrArena 
 * @param {Array} newAttrArena 
 * @param {Function} [patch] Optional callback for applying changes (mostly for tests)
 */
export function morph(oldArena, newArena, oldAttrArena, newAttrArena, patch) {
  let i = 0;
  const newLen = newArena.length;
  const oldLen = oldArena.length;

  checkHeap(newLen, newAttrArena.length);

  while (i < newLen) {
    const flags = newArena[i + SLOT_FLAGS];

    // If static, skip the entire subtree
    if (flags & STATIC) {
      const skip = newArena[i + SLOT_SUBTREE_SIZE];
      // Even if static, we need to preserve the DOM reference if it exists
      if (i < oldLen) {
        newArena[i + SLOT_DOM_INDEX] = oldArena[i + SLOT_DOM_INDEX];
      }
      i += skip > 0 ? skip : NODE_SIZE;
      continue;
    }

    // Basic diffing: compare data (tag name or text content)
    if (i < oldLen) {
      // Transfer DOM reference from old to new arena
      const domIndex = oldArena[i + SLOT_DOM_INDEX];
      newArena[i + SLOT_DOM_INDEX] = domIndex;
      
      // Always call updateNode if not static to handle attribute changes or tag changes
      if (patch && newArena[i + SLOT_DATA] !== oldArena[i + SLOT_DATA]) {
        patch(i, 'update', newArena[i + SLOT_DATA]);
      }
      updateNode(newArena, i, newAttrArena);
    } else {
      // New nodes beyond the old arena length
      if (patch) patch(i, 'create', newArena[i + SLOT_DATA]);
      createNode(newArena, i, newAttrArena);
    }

    i += NODE_SIZE;
  }
}
