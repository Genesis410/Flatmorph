export const NODE_SIZE = 8;

export const TYPE_TEXT = 0;
export const TYPE_ELEM = 1;
export const TYPE_FRAG = 2;

export const T_CHG  = 1 << 0;
export const A_CHG  = 1 << 1;
export const S_CHG  = 1 << 2;
export const E_CHG  = 1 << 3;
export const D_CHG  = 1 << 4;
export const STATIC = 1 << 5;

// Slot offsets
export const SLOT_TYPE = 0;
export const SLOT_FLAGS = 1;
export const SLOT_DATA = 2;
export const SLOT_FIRST_CHILD = 3;
export const SLOT_NEXT_SIBLING = 4;
export const SLOT_ATTR_START = 5;
export const SLOT_DOM_INDEX = 6;
export const SLOT_SUBTREE_SIZE = 7;
