// Constants
export const NODE_SIZE = 8;
export const TYPE_TEXT = 0;
export const TYPE_ELEM = 1;
export const T_CHG = 1, A_CHG = 2, S_CHG = 4, E_CHG = 8, D_CHG = 16, STATIC = 32;

export const SLOT_TYPE = 0;
export const SLOT_FLAGS = 1;
export const SLOT_DATA = 2;
export const SLOT_FIRST_CHILD = 3;
export const SLOT_NEXT_SIBLING = 4;
export const SLOT_ATTR_START = 5;
export const SLOT_DOM_INDEX = 6;
export const SLOT_SUBTREE_SIZE = 7;

// DOM & State
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

export function createNode(arena, idx) {
  const type = arena[idx + SLOT_TYPE];
  const data = arena[idx + SLOT_DATA];
  let el;

  if (type === TYPE_TEXT) {
    el = document.createTextNode(data);
  } else if (type === TYPE_ELEM) {
    el = document.createElement(data);
  }

  if (el) {
    const dIdx = domRefs.length;
    domRefs.push(el);
    arena[idx + SLOT_DOM_INDEX] = dIdx;
  }
  return el;
}

export function updateNode(arena, idx) {
  const dIdx = arena[idx + SLOT_DOM_INDEX];
  const el = domRefs[dIdx];
  if (!el) return null;

  const type = arena[idx + SLOT_TYPE];
  const data = arena[idx + SLOT_DATA];

  if (type === TYPE_TEXT && el.textContent !== data) {
    el.textContent = data;
  }
  return el;
}

export function mount(arena, idx = 0) {
  const el = createNode(arena, idx);
  if (!el) return null;

  let cIdx = arena[idx + SLOT_FIRST_CHILD];
  while (cIdx !== -1) {
    const cEl = mount(arena, cIdx);
    if (cEl) el.appendChild(cEl);
    cIdx = arena[cIdx + SLOT_NEXT_SIBLING];
  }
  return el;
}

// Parser
export function parse(html) {
  const arena = [];
  const attrArena = [];
  const stack = [];
  let lastRoot = -1;
  let i = 0;
  const len = html.length;

  const link = (idx) => {
    checkHeap(arena.length, attrArena.length);
    if (stack.length > 0) {
      const p = stack[stack.length - 1];
      if (p.lastChild === -1) arena[p.idx + SLOT_FIRST_CHILD] = idx;
      else arena[p.lastChild + SLOT_NEXT_SIBLING] = idx;
      p.lastChild = idx;
    } else {
      if (lastRoot !== -1) arena[lastRoot + SLOT_NEXT_SIBLING] = idx;
      lastRoot = idx;
    }
  };

  while (i < len) {
    const char = html[i];
    if (char === '<') {
      i++;
      if (i < len && html[i] === '/') {
        i++;
        while (i < len && html[i] !== '>') i++;
        if (i < len) i++;
        const e = stack.pop();
        if (e) arena[e.idx + SLOT_SUBTREE_SIZE] = arena.length - e.idx;
        continue;
      }

      const start = i;
      while (i < len && !/[\s/>]/.test(html[i])) i++;
      const tag = html.substring(start, i);
      const idx = arena.length;
      for (let j = 0; j < NODE_SIZE; j++) arena.push(-1);
      arena[idx + SLOT_TYPE] = TYPE_ELEM;
      arena[idx + SLOT_FLAGS] = 0;
      arena[idx + SLOT_DATA] = tag;
      link(idx);

      let isSelf = false;
      let attrStart = -1;
      while (i < len) {
        while (i < len && /\s/.test(html[i])) i++;
        if (i >= len || html[i] === '>') break;
        if (html[i] === '/' && html[i + 1] === '>') {
          isSelf = true;
          i += 2;
          break;
        }
        const nS = i;
        while (i < len && !/[\s=>/]/.test(html[i])) i++;
        const name = html.substring(nS, i);
        if (name.length > 0) {
          if (attrStart === -1) attrStart = attrArena.length;
          attrArena.push(name);
          while (i < len && /\s/.test(html[i])) i++;
          if (i < len && html[i] === '=') {
            i++;
            while (i < len && /\s/.test(html[i])) i++;
            if (i < len && (html[i] === '"' || html[i] === "'")) {
              const q = html[i++];
              const vS = i;
              while (i < len && html[i] !== q) i++;
              attrArena.push(html.substring(vS, i));
              if (i < len) i++;
            } else {
              const vS = i;
              while (i < len && !/[\s>]/.test(html[i])) i++;
              attrArena.push(html.substring(vS, i));
            }
          } else attrArena.push('');
        }
      }
      if (attrStart !== -1) {
        attrArena.push(null);
        arena[idx + SLOT_ATTR_START] = attrStart;
      }
      if (i < len && html[i] === '>') i++;
      if (isSelf) arena[idx + SLOT_SUBTREE_SIZE] = NODE_SIZE;
      else stack.push({ idx, lastChild: -1 });
    } else {
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
  while (stack.length > 0) {
    const e = stack.pop();
    arena[e.idx + SLOT_SUBTREE_SIZE] = arena.length - e.idx;
  }
  return { arena, attributeArena: attrArena };
}

// Morph
export function morph(oA, nA, oAA, nAA, patch) {
  let i = 0;
  const nL = nA.length, oL = oA.length;
  checkHeap(nL, nAA.length);

  while (i < nL) {
    const f = nA[i + SLOT_FLAGS];
    if (f & STATIC) {
      const s = nA[i + SLOT_SUBTREE_SIZE];
      if (i < oL) nA[i + SLOT_DOM_INDEX] = oA[i + SLOT_DOM_INDEX];
      i += s > 0 ? s : NODE_SIZE;
      continue;
    }
    if (i < oL) {
      const dIdx = oA[i + SLOT_DOM_INDEX];
      nA[i + SLOT_DOM_INDEX] = dIdx;
      if (nA[i + SLOT_DATA] !== oA[i + SLOT_DATA]) {
        if (patch) patch(i, 'update', nA[i + SLOT_DATA]);
        updateNode(nA, i);
      }
    } else {
      if (patch) patch(i, 'create', nA[i + SLOT_DATA]);
      createNode(nA, i);
    }
    i += NODE_SIZE;
  }
}

const FlatMorph = {
  parse, morph, mount, createNode, updateNode, setHeapLimit,
  NODE_SIZE, TYPE_TEXT, TYPE_ELEM, T_CHG, A_CHG, S_CHG, E_CHG, D_CHG, STATIC
};
export { FlatMorph };
export default FlatMorph;
