// @vitest-environment jsdom
import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { FlatMorph } from '../src/index.js';

describe('Torture Test', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle 5,000 nodes and rapid morphing', () => {
    const nodeCount = 5000;
    let html = '<div>';
    for (let i = 0; i < nodeCount; i++) {
      html += `<span>Item ${i}</span>`;
    }
    html += '</div>';

    const startParse = performance.now();
    const { arena, attributeArena } = FlatMorph.parse(html);
    const endParse = performance.now();
    console.log(`Parsed ${nodeCount} nodes in ${endParse - startParse}ms`);

    const container = document.getElementById('app');
    const root = FlatMorph.mount(arena);
    container.appendChild(root);

    expect(container.querySelectorAll('span').length).toBe(nodeCount);

    // Rapid morphing
    const iterations = 10;
    const startMorphTotal = performance.now();
    
    let currentArena = arena;
    let currentAttrArena = attributeArena;

    for (let i = 0; i < iterations; i++) {
      let nextHtml = '<div>';
      for (let j = 0; j < nodeCount; j++) {
        nextHtml += `<span>Item ${j + i}</span>`;
      }
      nextHtml += '</div>';

      const { arena: nextArena, attributeArena: nextAttrArena } = FlatMorph.parse(nextHtml);
      FlatMorph.morph(currentArena, nextArena, currentAttrArena, nextAttrArena);
      
      currentArena = nextArena;
      currentAttrArena = nextAttrArena;
    }

    const endMorphTotal = performance.now();
    console.log(`Morphed ${nodeCount} nodes ${iterations} times in ${endMorphTotal - startMorphTotal}ms`);
    console.log(`Average morph time: ${(endMorphTotal - startMorphTotal) / iterations}ms`);

    expect(container.querySelector('span').textContent).toBe(`Item ${iterations - 1}`);
  });

  it('should enforce heap limit', () => {
    FlatMorph.setHeapLimit(1000); // Very small limit
    
    const html = '<div><span>Test</span></div>'; // This should exceed 1000 bytes (roughly)
    // 2 nodes * 8 slots * 8 bytes = 128 bytes. Wait, maybe 1000 is enough.
    // Let's use a smaller limit like 100.
    FlatMorph.setHeapLimit(100);

    expect(() => {
      FlatMorph.parse(html);
    }).toThrow('FlatMorph: Heap limit exceeded');

    FlatMorph.setHeapLimit(Infinity);
  });
});
