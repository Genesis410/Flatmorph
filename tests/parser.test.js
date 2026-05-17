import { expect, test } from 'vitest';
import { scan } from '../src/parser.js';
import { TYPE_ELEM } from '../src/constants.js';

test('scans simple div', () => {
  const { arena } = scan('<div></div>');
  expect(arena[0]).toBe(TYPE_ELEM);
  expect(arena[2]).toBe('div');
});

test('scans multiple elements', () => {
  const { arena } = scan('<div><span></span></div>');
  // First element: div
  expect(arena[0]).toBe(TYPE_ELEM);
  expect(arena[2]).toBe('div');
  // Second element: span
  expect(arena[8]).toBe(TYPE_ELEM);
  expect(arena[10]).toBe('span');
});
