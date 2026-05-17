import { NODE_SIZE, TYPE_ELEM, SLOT_TYPE, SLOT_DATA } from './constants.js';

export function scan(html) {
  const arena = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    const charCode = html.charCodeAt(i);

    if (charCode === 60) { // '<'
      i++;
      if (i < len && html.charCodeAt(i) === 47) { // '/' - End tag
        i++;
        while (i < len && html.charCodeAt(i) !== 62) { // '>'
          i++;
        }
        i++;
        continue;
      }

      // Start tag
      const start = i;
      while (i < len && html.charCodeAt(i) !== 62 && html.charCodeAt(i) !== 32 && html.charCodeAt(i) !== 47) {
        i++;
      }
      
      const tagName = html.substring(start, i);
      
      // Allocate node
      const nodeIndex = arena.length;
      for (let j = 0; j < NODE_SIZE; j++) {
        arena.push(null);
      }
      
      arena[nodeIndex + SLOT_TYPE] = TYPE_ELEM;
      arena[nodeIndex + SLOT_DATA] = tagName;

      // Skip attributes and close tag for now
      while (i < len && html.charCodeAt(i) !== 62) {
        i++;
      }
      i++;
    } else {
      // Handle text nodes if needed, but the requirement just says identify tags for now
      i++;
    }
  }

  return { arena };
}
