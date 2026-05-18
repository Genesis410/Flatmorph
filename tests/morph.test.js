// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { morph } from '../src/morph.js';
import { STATIC, SLOT_FLAGS, SLOT_SUBTREE_SIZE, NODE_SIZE, SLOT_DATA } from '../src/constants.js';

test('skips static subtrees', () => {
  const patch = vi.fn();
  const oldArena = new Array(16).fill(0);
  const newArena = new Array(16).fill(0);
  
  // Set first node as STATIC with subtree size of 16 (2 nodes)
  newArena[SLOT_FLAGS] = STATIC;
  newArena[SLOT_SUBTREE_SIZE] = 16;
  
  morph(oldArena, newArena, [], [], patch);
  
  expect(patch).not.toHaveBeenCalled();
});

test('identifies updates', () => {
  const patch = vi.fn();
  const oldArena = new Array(8).fill(0);
  const newArena = new Array(8).fill(0);
  
  oldArena[SLOT_DATA] = 'div';
  newArena[SLOT_DATA] = 'span';
  
  morph(oldArena, newArena, [], [], patch);
  
  expect(patch).toHaveBeenCalledWith(0, 'update', 'span');
});

test('handles new nodes (create)', () => {
  const patch = vi.fn();
  const oldArena = [];
  const newArena = new Array(8).fill(0);
  
  newArena[SLOT_DATA] = 'p';
  
  morph(oldArena, newArena, [], [], patch);
  
  expect(patch).toHaveBeenCalledWith(0, 'create', 'p');
});

test('multiple nodes with mix of static and dynamic', () => {
  const patch = vi.fn();
  const oldArena = new Array(24).fill(0);
  const newArena = new Array(24).fill(0);
  
  // Node 1: Dynamic, no change
  oldArena[SLOT_DATA] = 'div';
  newArena[SLOT_DATA] = 'div';
  
  // Node 2: Static, skipped
  newArena[8 + SLOT_FLAGS] = STATIC;
  newArena[8 + SLOT_SUBTREE_SIZE] = 8;
  
  // Node 3: Dynamic, changed
  oldArena[16 + SLOT_DATA] = 'span';
  newArena[16 + SLOT_DATA] = 'b';
  
  morph(oldArena, newArena, [], [], patch);
  
  expect(patch).toHaveBeenCalledTimes(1);
  expect(patch).toHaveBeenCalledWith(16, 'update', 'b');
});
