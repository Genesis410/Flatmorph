import { expect, test } from 'vitest';
import { parse } from '../src/parser.js';
import { 
  TYPE_ELEM, 
  TYPE_TEXT,
  NODE_SIZE, 
  STATIC,
  SLOT_TYPE, 
  SLOT_FLAGS,
  SLOT_DATA, 
  SLOT_FIRST_CHILD, 
  SLOT_NEXT_SIBLING, 
  SLOT_ATTR_START,
  SLOT_SUBTREE_SIZE 
} from '../src/constants.js';

test('sets STATIC flag on all parsed nodes', () => {
  const { arena } = parse('<div><span>hello</span></div>');
  
  // div
  expect(arena[SLOT_FLAGS] & STATIC).toBeTruthy();
  
  // span
  expect(arena[NODE_SIZE + SLOT_FLAGS] & STATIC).toBeTruthy();
  
  // hello
  expect(arena[2 * NODE_SIZE + SLOT_FLAGS] & STATIC).toBeTruthy();
});

test('parses simple div', () => {
  const { arena } = parse('<div></div>');
  expect(arena[SLOT_TYPE]).toBe(TYPE_ELEM);
  expect(arena[SLOT_DATA]).toBe('div');
  expect(arena[SLOT_SUBTREE_SIZE]).toBe(NODE_SIZE);
});

test('parses attributes', () => {
  const { arena, attributeArena } = parse('<div class="foo" id="bar"></div>');
  const attrStart = arena[SLOT_ATTR_START];
  expect(attrStart).toBe(0);
  expect(attributeArena[attrStart]).toBe('class');
  expect(attributeArena[attrStart + 1]).toBe('foo');
  expect(attributeArena[attrStart + 2]).toBe('id');
  expect(attributeArena[attrStart + 3]).toBe('bar');
  expect(attributeArena[attrStart + 4]).toBe(null); // terminator
});

test('handles boolean and unquoted attributes', () => {
  const { arena, attributeArena } = parse('<input disabled value=foo>');
  const attrStart = arena[SLOT_ATTR_START];
  expect(attributeArena[attrStart]).toBe('disabled');
  expect(attributeArena[attrStart + 1]).toBe('');
  expect(attributeArena[attrStart + 2]).toBe('value');
  expect(attributeArena[attrStart + 3]).toBe('foo');
  expect(attributeArena[attrStart + 4]).toBe(null);
});

test('parses text nodes', () => {
  const { arena } = parse('<div>hello</div>');
  // div at 0
  expect(arena[SLOT_TYPE]).toBe(TYPE_ELEM);
  expect(arena[SLOT_FIRST_CHILD]).toBe(NODE_SIZE); // points to hello
  
  // text at NODE_SIZE (8)
  expect(arena[NODE_SIZE + SLOT_TYPE]).toBe(TYPE_TEXT);
  expect(arena[NODE_SIZE + SLOT_DATA]).toBe('hello');
  expect(arena[NODE_SIZE + SLOT_SUBTREE_SIZE]).toBe(NODE_SIZE);
});

test('parses nested elements', () => {
  const { arena } = parse('<div><span></span></div>');
  // div at 0
  expect(arena[SLOT_TYPE]).toBe(TYPE_ELEM);
  expect(arena[SLOT_DATA]).toBe('div');
  expect(arena[SLOT_FIRST_CHILD]).toBe(NODE_SIZE); // points to span
  expect(arena[SLOT_SUBTREE_SIZE]).toBe(2 * NODE_SIZE);
  
  // span at NODE_SIZE (8)
  expect(arena[NODE_SIZE + SLOT_TYPE]).toBe(TYPE_ELEM);
  expect(arena[NODE_SIZE + SLOT_DATA]).toBe('span');
  expect(arena[NODE_SIZE + SLOT_FIRST_CHILD]).toBe(-1);
  expect(arena[NODE_SIZE + SLOT_NEXT_SIBLING]).toBe(-1);
  expect(arena[NODE_SIZE + SLOT_SUBTREE_SIZE]).toBe(NODE_SIZE);
});

test('parses siblings', () => {
  const { arena } = parse('<div><span></span><a></a></div>');
  // div at 0
  expect(arena[SLOT_DATA]).toBe('div');
  expect(arena[SLOT_FIRST_CHILD]).toBe(NODE_SIZE);
  expect(arena[SLOT_SUBTREE_SIZE]).toBe(3 * NODE_SIZE);

  // span at 8
  expect(arena[NODE_SIZE + SLOT_DATA]).toBe('span');
  expect(arena[NODE_SIZE + SLOT_NEXT_SIBLING]).toBe(2 * NODE_SIZE); // points to a
  expect(arena[NODE_SIZE + SLOT_SUBTREE_SIZE]).toBe(NODE_SIZE);

  // a at 16
  expect(arena[2 * NODE_SIZE + SLOT_DATA]).toBe('a');
  expect(arena[2 * NODE_SIZE + SLOT_NEXT_SIBLING]).toBe(-1);
  expect(arena[2 * NODE_SIZE + SLOT_SUBTREE_SIZE]).toBe(NODE_SIZE);
});

test('handles attributes with quotes', () => {
  const { arena } = parse('<div class="foo > bar" id=\'baz\'></div>');
  expect(arena[SLOT_DATA]).toBe('div');
  expect(arena[SLOT_SUBTREE_SIZE]).toBe(NODE_SIZE);
});

test('parses immediate siblings', () => {
  const { arena } = parse('<img/><span/>');
  expect(arena[SLOT_DATA]).toBe('img');
  expect(arena[NODE_SIZE + SLOT_DATA]).toBe('span');
});

test('links root-level siblings', () => {
  const { arena } = parse('<div></div><span></span>');
  expect(arena[SLOT_NEXT_SIBLING]).toBe(NODE_SIZE);
  expect(arena[NODE_SIZE + SLOT_NEXT_SIBLING]).toBe(-1);
});
