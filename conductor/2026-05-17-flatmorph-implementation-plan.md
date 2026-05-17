# FlatMorph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-performance, deterministic DOM runtime under 2KB gzipped.

**Architecture:** A flat-arena hybrid architecture using 8-slot node tuples in a linear array. It uses a streaming char-scanner for AST-free parsing and iterative bitmask-based morphing.

**Tech Stack:** Vanilla JavaScript (ES6+), Vitest (for testing).

---

## Phase 1: Core Foundation & Types

### Task 1: Initialize Project & Constants

**Files:**
- Create: `package.json`
- Create: `src/constants.js`
- Create: `src/index.js`

- [ ] **Step 1: Create package.json with Vitest**

```json
{
  "name": "flatmorph",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Define Core Constants & Bitmasks**

```javascript
// src/constants.js
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
```

- [ ] **Step 3: Commit**
```bash
git add package.json src/constants.js src/index.js
git commit -m "chore: initialize project and core constants"
```

---

## Phase 2: The Arena & Streaming Scanner

### Task 2: Implement the Char-Scanner (Parser)

**Files:**
- Create: `src/parser.js`
- Test: `tests/parser.test.js`

- [ ] **Step 1: Write failing test for basic tag scanning**

```javascript
import { expect, test } from 'vitest';
import { scan } from '../src/parser.js';
import { TYPE_ELEM } from '../src/constants.js';

test('scans simple div', () => {
  const { arena } = scan('<div></div>');
  expect(arena[0]).toBe(TYPE_ELEM);
  expect(arena[2]).toBe('div');
});
```

- [ ] **Step 2: Implement the minimal scanner**
Implement `scan(html)` using `charCodeAt` loop. It should populate the arena array.

- [ ] **Step 3: Run tests and verify PASS**

- [ ] **Step 4: Commit**
```bash
git add src/parser.js tests/parser.test.js
git commit -m "feat: implement basic char-scanner"
```

### Task 3: Calculate Subtree Size & Hierarchy

- [ ] **Step 1: Update scanner to handle FIRST_CHILD and NEXT_SIBLING**
- [ ] **Step 2: Implement SUBTREE_SIZE calculation on stack unwind**
- [ ] **Step 3: Add tests for nested structures**

---

## Phase 3: The Morph Engine (Reconciler)

### Task 4: Implement Iterative Morph Loop

**Files:**
- Create: `src/morph.js`
- Test: `tests/morph.test.js`

- [ ] **Step 1: Write test for text content update**
- [ ] **Step 2: Implement morph(oldArena, newArena) using bitmasks**
- [ ] **Step 3: Implement O(1) Static skipping logic**

---

## Phase 4: DOM Integration & Performance

### Task 5: External DOM Reference Table

- [ ] **Step 1: Implement `domRefs` array management**
- [ ] **Step 2: Link Arena nodes to DOM nodes via `DOM_INDEX`**
- [ ] **Step 3: Test O(1) patching via direct reference**

---

## Phase 5: Finalization & Benchmarking

### Task 6: Bundle Size & Heap Optimization

- [ ] **Step 1: Check bundle size target (<2KB gzipped)**
- [ ] **Step 2: Implement Heap Ceiling check**
- [ ] **Step 3: Run "Low-End Torture" benchmarks**
