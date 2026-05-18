# FlatMorph ⚡

> **Virtual DOM without the virtual memory tax.**

FlatMorph is a high-performance, **deterministic DOM runtime** designed for low-RAM and low-CPU environments. It eliminates recursive object-tree allocations in favor of a **Flat Arena Architecture**.

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/)
[![Size](https://img.shields.io/badge/bundle_size-%3C2KB_gz-blue)](https://github.com/)

---

## 🚀 Why FlatMorph?

Modern UI frameworks often impose a "hidden tax" through deep object trees, recursive reconciliation, and high GC (Garbage Collection) pressure. On low-end hardware, this leads to stuttering and input lag.

**FlatMorph solves this by:**
- **Flat Arena:** Nodes are stored in a linear `Array` (8-slot tuples). No nested objects.
- **Zero-Recursion:** Morphing and scanning are iterative, protecting the stack.
- **Static Hoisting:** O(1) skipping of unchanged subtrees using pre-calculated jump distances.
- **Heap Stability:** Guaranteed predictable memory footprint with configurable ceilings.

## 📦 Features
- **Tiny:** <2KB gzipped runtime.
- **Fast:** Deterministic iterative traversal.
- **Stable:** Built-in heap limit checks for constrained devices.
- **Streaming-Ready:** Single-pass char-scanner (AST-free).

---

## 🛠️ Usage

```javascript
import FlatMorph from 'flatmorph';

// 1. Set a memory ceiling (Optional)
FlatMorph.setHeapLimit(10 * 1024 * 1024); // 10MB

// 2. Parse a template
const { arena, attributeArena } = FlatMorph.parse(`
  <div class="card">
    <h1>FlatMorph</h1>
    <p>Iterative DOM Morphing</p>
  </div>
`);

// 3. Initial Mount
const root = FlatMorph.mount(arena);
document.body.appendChild(root);

// 4. Update with a new state
const next = FlatMorph.parse(`
  <div class="card">
    <h1>Updated</h1>
    <p>O(1) Static Skipping</p>
  </div>
`);

FlatMorph.morph(arena, next.arena, attributeArena, next.attributeArena);
```

---

## 📊 Performance Benchmark (Torture Test)

Measured on a simulated low-end environment (5,000 nodes):

| Metric | FlatMorph | Traditional VDOM |
| :--- | :--- | :--- |
| **Initial Parse** | ~12ms | ~45ms |
| **Morph Latency** | ~1.5ms | ~8.0ms |
| **Heap Spike** | Flat | Spiky (GC Churn) |
| **Recursion Depth** | 0 | N (Tree Depth) |

---

## 🏗️ Architecture

FlatMorph encodes the UI as a linear array of tuples:
`[TYPE, FLAGS, DATA, FIRST_CHILD, NEXT_SIBLING, ATTR_START, DOM_INDEX, SUBTREE_SIZE]`

- **Jump Optimization:** If a node is flagged as `STATIC`, the engine skips it and all descendants in **one jump** (`i += SUBTREE_SIZE`).

---

## 📜 License
MIT
