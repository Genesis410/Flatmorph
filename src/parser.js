import { 
  NODE_SIZE, 
  TYPE_TEXT,
  TYPE_ELEM, 
  SLOT_TYPE, 
  SLOT_FLAGS,
  SLOT_DATA, 
  SLOT_FIRST_CHILD, 
  SLOT_NEXT_SIBLING, 
  SLOT_ATTR_START, 
  SLOT_DOM_INDEX, 
  SLOT_SUBTREE_SIZE 
} from './constants.js';
import { checkHeap } from './dom.js';

export function scan(html) {
  const arena = [];
  const attrArena = [];
  const stack = []; // Elements: { idx, lastChild }
  let lastRoot = -1;
  
  let i = 0;
  const len = html.length;

  const link = (idx) => {
    checkHeap(arena.length, attrArena.length);
    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      if (parent.lastChild === -1) {
        arena[parent.idx + SLOT_FIRST_CHILD] = idx;
      } else {
        arena[parent.lastChild + SLOT_NEXT_SIBLING] = idx;
      }
      parent.lastChild = idx;
    } else {
      if (lastRoot !== -1) {
        arena[lastRoot + SLOT_NEXT_SIBLING] = idx;
      }
      lastRoot = idx;
    }
  };

  while (i < len) {
    const char = html[i];

    if (char === '<') {
      i++;
      if (i < len && html[i] === '/') { // End tag
        i++;
        while (i < len && html[i] !== '>') i++;
        if (i < len) i++;
        
        const entry = stack.pop();
        if (entry) {
          arena[entry.idx + SLOT_SUBTREE_SIZE] = arena.length - entry.idx;
        }
        continue;
      }

      // Start tag
      const start = i;
      while (i < len && !/[\s/>]/.test(html[i])) i++;
      
      const tagName = html.substring(start, i);
      const idx = arena.length;
      
      // Initialize slots
      for (let j = 0; j < NODE_SIZE; j++) arena.push(-1);
      
      arena[idx + SLOT_TYPE] = TYPE_ELEM;
      arena[idx + SLOT_FLAGS] = 0;
      arena[idx + SLOT_DATA] = tagName;

      // Hierarchy
      link(idx);

      // Attributes & self-closing detection
      let isSelf = false;
      let attrStart = -1;

      while (i < len) {
        // Skip whitespace
        while (i < len && /\s/.test(html[i])) i++;
        
        if (i >= len || html[i] === '>') break;
        
        if (html[i] === '/' && html[i + 1] === '>') {
          isSelf = true;
          i += 2;
          break;
        }

        // Parse attribute name
        const nameStart = i;
        while (i < len && !/[\s=>/]/.test(html[i])) i++;
        const name = html.substring(nameStart, i);
        
        if (name.length > 0) {
          if (attrStart === -1) {
            attrStart = attrArena.length;
          }
          attrArena.push(name);
          
          // Skip whitespace around '='
          while (i < len && /\s/.test(html[i])) i++;
          
          if (i < len && html[i] === '=') {
            i++;
            while (i < len && /\s/.test(html[i])) i++;
            
            if (i < len && (html[i] === '"' || html[i] === "'")) {
              const quote = html[i];
              i++;
              const valStart = i;
              while (i < len && html[i] !== quote) i++;
              attrArena.push(html.substring(valStart, i));
              if (i < len) i++; // skip closing quote
            } else {
              // Unquoted value
              const valStart = i;
              while (i < len && !/[\s>]/.test(html[i])) i++;
              attrArena.push(html.substring(valStart, i));
            }
          } else {
            // Boolean attribute
            attrArena.push('');
          }
        }
      }

      if (attrStart !== -1) {
        attrArena.push(null); // terminator
        arena[idx + SLOT_ATTR_START] = attrStart;
      }

      if (i < len && html[i] === '>') i++;
      
      if (isSelf) {
        arena[idx + SLOT_SUBTREE_SIZE] = NODE_SIZE;
      } else {
        stack.push({ idx: idx, lastChild: -1 });
      }
    } else {
      // Text nodes
      const start = i;
      while (i < len && html[i] !== '<') i++;
      const text = html.substring(start, i);
      
      if (text.length > 0) {
        const idx = arena.length;
        for (let j = 0; j < NODE_SIZE; j++) arena.push(-1);
        
        arena[idx + SLOT_TYPE] = TYPE_TEXT;
        arena[idx + SLOT_FLAGS] = 0;
        arena[idx + SLOT_DATA] = text;
        arena[idx + SLOT_SUBTREE_SIZE] = NODE_SIZE;

        link(idx);
      }
    }
  }

  // Handle any unclosed tags
  while (stack.length > 0) {
    const entry = stack.pop();
    arena[entry.idx + SLOT_SUBTREE_SIZE] = arena.length - entry.idx;
  }

  return { arena, attributeArena: attrArena };
}

