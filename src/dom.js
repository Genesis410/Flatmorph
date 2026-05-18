import { 
  SLOT_TYPE, TYPE_TEXT, TYPE_ELEM, 
  SLOT_DATA, SLOT_DOM_INDEX,
  SLOT_FIRST_CHILD, SLOT_NEXT_SIBLING,
  SLOT_ATTR_START
} from './constants.js';

export const domRefs = [];
let heapLimit = Infinity;

export function setHeapLimit(bytes) {
  heapLimit = bytes;
}

export function cleanupNode(idx) {
  if (idx !== -1 && idx < domRefs.length) {
    domRefs[idx] = null;
  }
}

export function checkHeap(arenaLen, attrLen, dataStringsLen = 0) {
  const totalBytes = (arenaLen + attrLen) * 8 + (dataStringsLen * 2);
  if (totalBytes > heapLimit) {
    throw new Error('FlatMorph: Heap limit exceeded');
  }
}

/**
 * Applies attributes from attrArena to the DOM element.
 * 
 * @param {Element} el 
 * @param {Array|TypedArray} arena 
 * @param {number} nodeIndex 
 * @param {Array} attrArena 
 */
function applyAttributes(el, arena, nodeIndex, attrArena) {
  const attrStart = arena[nodeIndex + SLOT_ATTR_START];
  if (attrStart === -1 || !attrArena) return;

  const seenAttrs = new Set();
  let i = attrStart;
  while (i < attrArena.length && attrArena[i] !== null) {
    const name = attrArena[i];
    const value = attrArena[i + 1];
    if (el.getAttribute(name) !== value) {
      el.setAttribute(name, value);
    }
    seenAttrs.add(name);
    i += 2;
  }
  
  // Remove attributes that are no longer present
  const toRemove = [];
  for (let j = 0; j < el.attributes.length; j++) {
    const attr = el.attributes[j];
    if (!seenAttrs.has(attr.name)) {
      toRemove.push(attr.name);
    }
  }
  for (const name of toRemove) {
    el.removeAttribute(name);
  }
}

/**
 * Creates a real DOM node for the given arena node and stores it in domRefs.
 * 
 * @param {Array|TypedArray} arena 
 * @param {number} nodeIndex 
 * @param {Array} [attrArena]
 * @returns {Node} The created DOM node.
 */
export function createNode(arena, nodeIndex, attrArena) {
  const type = arena[nodeIndex + SLOT_TYPE];
  const data = arena[nodeIndex + SLOT_DATA];
  let el;

  if (type === TYPE_TEXT) {
    el = document.createTextNode(data);
  } else if (type === TYPE_ELEM) {
    el = document.createElement(data);
    if (attrArena) {
      applyAttributes(el, arena, nodeIndex, attrArena);
    }
  }

  if (el) {
    const domIndex = domRefs.length;
    domRefs.push(el);
    arena[nodeIndex + SLOT_DOM_INDEX] = domIndex;
  }

  return el;
}

/**
 * Updates a real DOM node based on the arena node data.
 * 
 * @param {Array|TypedArray} arena 
 * @param {number} nodeIndex 
 * @param {Array} [attrArena]
 * @returns {Node} The updated DOM node.
 */
export function updateNode(arena, nodeIndex, attrArena) {
  const domIndex = arena[nodeIndex + SLOT_DOM_INDEX];
  const el = domRefs[domIndex];
  if (!el) return null;

  const type = arena[nodeIndex + SLOT_TYPE];
  const data = arena[nodeIndex + SLOT_DATA];

  if (type === TYPE_TEXT) {
    if (el.textContent !== data) {
      el.textContent = data;
    }
  } else if (type === TYPE_ELEM) {
    // Tag change check: if tag differs, replace element but keep children
    if (el.tagName.toLowerCase() !== data.toLowerCase()) {
      const newEl = document.createElement(data);
      
      // Move children from old to new
      while (el.firstChild) {
        newEl.appendChild(el.firstChild);
      }
      
      // Replace in DOM
      if (el.parentNode) {
        el.parentNode.replaceChild(newEl, el);
      }
      
      cleanupNode(domIndex);

      // Update reference
      domRefs[domIndex] = newEl;
      
      // Apply attributes to new element
      if (attrArena) {
        applyAttributes(newEl, arena, nodeIndex, attrArena);
      }
      return newEl;
    }

    // Same tag, just patch attributes
    if (attrArena) {
      applyAttributes(el, arena, nodeIndex, attrArena);
    }
  }
  
  return el;
}

/**
 * Initial render of an arena into a container.
 * Iteratively builds the DOM tree and links it to the arena.
 * 
 * @param {Array|TypedArray} arena 
 * @param {Array} [attrArena]
 * @param {number} nodeIndex 
 * @returns {Node} The root DOM node.
 */
export function mount(arena, attrArena, nodeIndex = 0) {
  const stack = [{ idx: nodeIndex, parentEl: null }];
  let rootEl = null;

  while (stack.length > 0) {
    const { idx, parentEl } = stack.pop();
    const el = createNode(arena, idx, attrArena);
    
    if (el === null) continue;

    if (rootEl === null) {
      rootEl = el;
    }
    
    if (parentEl !== null) {
      parentEl.appendChild(el);
    }

    // Collect children to push them in reverse order to maintain correct DOM order
    let childIdx = arena[idx + SLOT_FIRST_CHILD];
    if (childIdx !== -1) {
      const children = [];
      while (childIdx !== -1) {
        children.push(childIdx);
        childIdx = arena[childIdx + SLOT_NEXT_SIBLING];
      }
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ idx: children[i], parentEl: el });
      }
    }
  }

  return rootEl;
}
