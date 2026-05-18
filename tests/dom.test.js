// @vitest-environment jsdom
import { expect, test, beforeEach } from 'vitest';
import { parse } from '../src/parser.js';
import { mount, domRefs } from '../src/dom.js';
import { morph } from '../src/morph.js';
import { SLOT_DOM_INDEX, STATIC, SLOT_FLAGS, SLOT_SUBTREE_SIZE } from '../src/constants.js';

beforeEach(() => {
  domRefs.length = 0; // Clear refs between tests
});

test('mount creates real DOM and links it', () => {
  const { arena } = parse('<div><span>hello</span></div>');
  const el = mount(arena);
  
  expect(el.tagName).toBe('DIV');
  expect(el.firstChild.tagName).toBe('SPAN');
  expect(el.firstChild.firstChild.textContent).toBe('hello');
  
  // Check domRefs linkage
  // SLOT_DOM_INDEX is 6
  expect(domRefs[arena[0 + SLOT_DOM_INDEX]]).toBe(el);
  expect(domRefs[arena[8 + SLOT_DOM_INDEX]]).toBe(el.firstChild);
  expect(domRefs[arena[16 + SLOT_DOM_INDEX]]).toBe(el.firstChild.firstChild);
});

test('morph updates real DOM via domRefs', () => {
  const oldResult = parse('<div>hello</div>');
  const el = mount(oldResult.arena);
  
  expect(el.textContent).toBe('hello');
  
  const newResult = parse('<div>world</div>');
  
  // In our simple morph, it compares by index.
  // The text node is at index 8.
  morph(oldResult.arena, newResult.arena, oldResult.attributeArena, newResult.attributeArena);
  
  expect(el.textContent).toBe('world');
});

test('static nodes preserve DOM references', () => {
  // Use a string that our parser can identify as static?
  // Our current parser doesn't mark static yet, we manually set it for testing.
  const { arena } = parse('<div>static</div>');
  const el = mount(arena);
  
  const domIndex = arena[0 + SLOT_DOM_INDEX];
  expect(domIndex).toBeDefined();
  
  const newResult = parse('<div>static</div>');
  // Manually mark as static
  newResult.arena[0 + SLOT_FLAGS] = STATIC;
  newResult.arena[0 + SLOT_SUBTREE_SIZE] = 16;
  
  morph(arena, newResult.arena, [], []);
  
  expect(newResult.arena[0 + SLOT_DOM_INDEX]).toBe(domIndex);
});
