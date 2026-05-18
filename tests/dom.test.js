// @vitest-environment jsdom
import { expect, test, beforeEach } from 'vitest';
import { parse } from '../src/parser.js';
import { mount, domRefs } from '../src/dom.js';
import { morph } from '../src/morph.js';
import { SLOT_DOM_INDEX, STATIC, SLOT_FLAGS, SLOT_SUBTREE_SIZE } from '../src/constants.js';

beforeEach(() => {
  domRefs.length = 0; // Clear refs between tests
});

function clearStatic(result) {
  for (let i = 0; i < result.arena.length; i += 8) {
    result.arena[i + 1] &= ~32; // SLOT_FLAGS = 1, STATIC = 32
  }
  return result;
}

test('mount creates real DOM and links it', () => {
  const { arena, attributeArena } = parse('<div><span>hello</span></div>');
  const el = mount(arena, attributeArena);
  
  expect(el.tagName).toBe('DIV');
  expect(el.firstChild.tagName).toBe('SPAN');
  expect(el.firstChild.firstChild.textContent).toBe('hello');
  
  // Check domRefs linkage
  // SLOT_DOM_INDEX is 6
  expect(domRefs[arena[0 + SLOT_DOM_INDEX]]).toBe(el);
  expect(domRefs[arena[8 + SLOT_DOM_INDEX]]).toBe(el.firstChild);
  expect(domRefs[arena[16 + SLOT_DOM_INDEX]]).toBe(el.firstChild.firstChild);
});

test('mount applies attributes', () => {
  const { arena, attributeArena } = parse('<div class="foo" id="bar">hello</div>');
  const el = mount(arena, attributeArena);
  
  expect(el.className).toBe('foo');
  expect(el.id).toBe('bar');
  expect(el.textContent).toBe('hello');
});

test('morph updates attributes', () => {
  const oldResult = parse('<div class="foo">hello</div>');
  const el = mount(oldResult.arena, oldResult.attributeArena);
  
  expect(el.className).toBe('foo');
  
  const newResult = clearStatic(parse('<div class="bar">hello</div>'));
  morph(oldResult.arena, newResult.arena, oldResult.attributeArena, newResult.attributeArena);
  
  expect(el.className).toBe('bar');
});

test('morph handles removed attributes', () => {
  const oldResult = parse('<div class="foo" id="bar">hello</div>');
  const el = mount(oldResult.arena, oldResult.attributeArena);
  
  expect(el.className).toBe('foo');
  expect(el.id).toBe('bar');
  
  const newResult = clearStatic(parse('<div class="foo">hello</div>'));
  morph(oldResult.arena, newResult.arena, oldResult.attributeArena, newResult.attributeArena);
  
  expect(el.className).toBe('foo');
  expect(el.hasAttribute('id')).toBe(false);
});

test('morph handles element replacement but preserves children', () => {
  const oldResult = parse('<div><span>hello</span></div>');
  const el = mount(oldResult.arena, oldResult.attributeArena);
  const span = el.firstChild;
  
  expect(el.tagName).toBe('DIV');
  expect(span.tagName).toBe('SPAN');
  
  const newResult = clearStatic(parse('<section><span>hello</span></section>'));
  morph(oldResult.arena, newResult.arena, oldResult.attributeArena, newResult.attributeArena);
  
  // The root element in our test is 'el', but morph might have replaced it.
  // However, el is the root we mounted. If we replaced it, we need to check the new reference.
  const newEl = domRefs[newResult.arena[0 + SLOT_DOM_INDEX]];
  expect(newEl.tagName).toBe('SECTION');
  expect(newEl.firstChild).toBe(span); // Preserved
  expect(newEl.firstChild.textContent).toBe('hello');
});

test('morph updates real DOM via domRefs', () => {
  const oldResult = parse('<div>hello</div>');
  const el = mount(oldResult.arena, oldResult.attributeArena);
  
  expect(el.textContent).toBe('hello');
  
  const newResult = clearStatic(parse('<div>world</div>'));
  
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

test('mount handles deep nesting without stack overflow', () => {
  const depth = 1000;
  let html = '';
  for (let i = 0; i < depth; i++) html += '<div>';
  html += 'bottom';
  for (let i = 0; i < depth; i++) html += '</div>';
  
  const { arena, attributeArena } = parse(html);
  const el = mount(arena, attributeArena);
  
  expect(el).toBeDefined();
  
  let current = el;
  let count = 0;
  while (current && current.tagName === 'DIV') {
    count++;
    current = current.firstChild;
  }
  
  expect(count).toBe(depth);
  expect(current.textContent).toBe('bottom');
});
