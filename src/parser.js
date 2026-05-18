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

export function scan(html) {
  const arena = [];
  const stack = []; // Elements: { index, lastChild }
  let lastRootNode = -1;
  
  let i = 0;
  const len = html.length;

  const linkNode = (nodeIndex) => {
    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      if (parent.lastChild === -1) {
        arena[parent.index + SLOT_FIRST_CHILD] = nodeIndex;
      } else {
        arena[parent.lastChild + SLOT_NEXT_SIBLING] = nodeIndex;
      }
      parent.lastChild = nodeIndex;
    } else {
      if (lastRootNode !== -1) {
        arena[lastRootNode + SLOT_NEXT_SIBLING] = nodeIndex;
      }
      lastRootNode = nodeIndex;
    }
  };

  while (i < len) {
    const char = html[i];

    if (char === '<') {
      i++;
      if (i < len && html[i] === '/') { // End tag
        i++;
        while (i < len && html[i] !== '>') i++;
        i++;
        
        const entry = stack.pop();
        if (entry) {
          arena[entry.index + SLOT_SUBTREE_SIZE] = arena.length - entry.index;
        }
        continue;
      }

      // Start tag
      const start = i;
      while (i < len && !/[\s/>]/.test(html[i])) i++;
      
      const tagName = html.substring(start, i);
      const nodeIndex = arena.length;
      
      // Initialize slots
      for (let j = 0; j < NODE_SIZE; j++) arena.push(-1);
      
      arena[nodeIndex + SLOT_TYPE] = TYPE_ELEM;
      arena[nodeIndex + SLOT_FLAGS] = 0;
      arena[nodeIndex + SLOT_DATA] = tagName;

      // Hierarchy
      linkNode(nodeIndex);

      // Attributes & self-closing detection
      let selfClosing = false;
      while (i < len && html[i] !== '>') {
        const c = html[i];
        if (c === '"' || c === "'") {
          i++;
          while (i < len && html[i] !== c) i++;
        } else if (c === '/' && html[i + 1] === '>') {
          selfClosing = true;
          i++; // skip '/'
          break;
        }
        i++;
      }
      if (i < len && html[i] === '>') i++;
      
      if (selfClosing) {
        arena[nodeIndex + SLOT_SUBTREE_SIZE] = NODE_SIZE;
      } else {
        stack.push({ index: nodeIndex, lastChild: -1 });
      }
    } else {
      // Text nodes
      const start = i;
      while (i < len && html[i] !== '<') i++;
      const text = html.substring(start, i);
      
      if (text.length > 0) {
        const nodeIndex = arena.length;
        for (let j = 0; j < NODE_SIZE; j++) arena.push(-1);
        
        arena[nodeIndex + SLOT_TYPE] = TYPE_TEXT;
        arena[nodeIndex + SLOT_FLAGS] = 0;
        arena[nodeIndex + SLOT_DATA] = text;
        arena[nodeIndex + SLOT_SUBTREE_SIZE] = NODE_SIZE;

        linkNode(nodeIndex);
      }
    }
  }

  // Handle any unclosed tags
  while (stack.length > 0) {
    const entry = stack.pop();
    arena[entry.index + SLOT_SUBTREE_SIZE] = arena.length - entry.index;
  }

  return { arena };
}
