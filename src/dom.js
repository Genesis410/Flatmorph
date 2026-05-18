import { 
  SLOT_TYPE, TYPE_TEXT, TYPE_ELEM, 
  SLOT_DATA, SLOT_DOM_INDEX,
  SLOT_FIRST_CHILD, SLOT_NEXT_SIBLING
} from './constants.js';

export const domRefs = [];
let heapLimit = Infinity;

export function setHeapLimit(bytes) {
  heapLimit = bytes;
}

export function checkHeap(arenaLen, attrLen) {
  if ((arenaLen + attrLen) * 8 > heapLimit) {
    throw new Error('FlatMorph: Heap limit exceeded');
  }
}

/**
 * Creates a real DOM node for the given arena node and stores it in domRefs.
 * 
 * @param {Array|TypedArray} arena 
 * @param {number} nodeIndex 
 * @returns {Node} The created DOM node.
 */
export function createNode(arena, nodeIndex) {
  const type = arena[nodeIndex + SLOT_TYPE];
  const data = arena[nodeIndex + SLOT_DATA];
  let el;

  if (type === TYPE_TEXT) {
    el = document.createTextNode(data);
  } else if (type === TYPE_ELEM) {
    el = document.createElement(data);
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
 * @returns {Node} The updated DOM node.
 */
export function updateNode(arena, nodeIndex) {
  const domIndex = arena[nodeIndex + SLOT_DOM_INDEX];
  const el = domRefs[domIndex];
  if (!el) return null;

  const type = arena[nodeIndex + SLOT_TYPE];
  const data = arena[nodeIndex + SLOT_DATA];

  if (type === TYPE_TEXT) {
    if (el.textContent !== data) {
      el.textContent = data;
    }
  }
  
  return el;
}

/**
 * Initial render of an arena into a container.
 * Recursively builds the DOM tree and links it to the arena.
 * 
 * @param {Array|TypedArray} arena 
 * @param {number} nodeIndex 
 * @returns {Node} The root DOM node.
 */
export function mount(arena, nodeIndex = 0) {
  const el = createNode(arena, nodeIndex);
  if (!el) return null;

  let childIndex = arena[nodeIndex + SLOT_FIRST_CHILD];
  while (childIndex !== -1) {
    const childEl = mount(arena, childIndex);
    if (childEl) {
      el.appendChild(childEl);
    }
    childIndex = arena[childIndex + SLOT_NEXT_SIBLING];
  }

  return el;
}
