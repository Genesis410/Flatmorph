import { performance } from 'perf_hooks';
import { test, expect } from 'vitest';
import { morph } from '../src/morph.js';
import { parse } from '../src/parser.js';

// Benchmark configuration
const ITERATIONS = 100;
const ITEM_COUNT = 1000;

function createData(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: i, text: `Item ${i}`, selected: false, priority: i % 3 });
  }
  return items;
}

function render(items) {
  return `
    <ul class="list">
      ${items.map(item => `
        <li data-priority="${item.priority}" class="${item.selected ? 'selected' : ''}">
          ${item.text}
        </li>
      `).join('')}
    </ul>
  `;
}

function mutate(items) {
  const rand = Math.random();
  if (rand < 0.25) {
    items.push({ id: Date.now(), text: 'New Item', selected: false, priority: 0 });
  } else if (rand < 0.50 && items.length > 10) {
    items.splice(Math.floor(Math.random() * items.length), 1);
  } else {
    const idx = Math.floor(Math.random() * items.length);
    items[idx].text = `Updated ${Math.random()}`;
    items[idx].selected = !items[idx].selected;
  }
}

test('run complex entropy benchmark', async () => {
  let items = createData(ITEM_COUNT);
  
  let vdomResult = parse(render(items));
  let oldArena = vdomResult.arena;
  let oldAttrArena = vdomResult.attributeArena;
  
  const start = performance.now();
  const startMem = process.memoryUsage().rss;

  for (let i = 0; i < ITERATIONS; i++) {
    mutate(items);
    let newVDomResult = parse(render(items));
    let newArena = newVDomResult.arena;
    let newAttrArena = newVDomResult.attributeArena;
    
    morph(oldArena, newArena, oldAttrArena, newAttrArena);
    
    oldArena = newArena;
    oldAttrArena = newAttrArena;
  }

  const end = performance.now();
  const endMem = process.memoryUsage().rss;

  console.log(`--- Benchmark Report ---`);
  console.log(`Total Time: ${(end - start).toFixed(2)}ms`);
  console.log(`Avg Time/Cycle: ${((end - start) / ITERATIONS).toFixed(2)}ms`);
  console.log(`RSS Memory Increase: ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`);
  
  expect(end - start).toBeLessThan(2000); // Expect reasonable performance
});
