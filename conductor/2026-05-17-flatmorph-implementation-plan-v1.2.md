# FlatMorph Implementation Plan v1.2: The Wiring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical bugs, eliminate code duplication, and complete the missing DOM integration layer to fulfill the "Zero-Recursion" and "Flat-Memory" promises.

**Architecture:** Restoring the modular structure (parser, morph, dom) and implementing the iterative tree management and static hoisting logic.

**Tech Stack:** Vanilla JavaScript (ES6+), Vitest (jsdom).

---

## Phase 1: Cleanup & Maintenance

### Task 1: Eliminate Code Duplication

**Files:**
- Delete: `src/flatmorph.js`
- Modify: `src/index.js`
- Modify: `package.json`

- [ ] **Step 1: Delete the monolithic `src/flatmorph.js`**
We will rely on the modular files (`parser.js`, `morph.js`, `dom.js`) to prevent silent divergence.

- [ ] **Step 2: Update `src/index.js` to re-export from modular files**

```javascript
import * as Constants from './constants.js';
import { parse } from './parser.js';
import { morph } from './morph.js';
import { mount, createNode, updateNode, setHeapLimit } from './dom.js';

const FlatMorph = {
  parse, morph, mount, createNode, updateNode, setHeapLimit,
  ...Constants
};

export { FlatMorph, parse, morph, mount, createNode, updateNode, setHeapLimit };
export default FlatMorph;
```

- [ ] **Step 3: Fix Vitest syntax in `tests/perf.test.js`**
Replace `expect(x).to.equal(y)` with `expect(x).toBe(y)` and `.to.throw()` with `.toThrow()`.

---

## Phase 2: Missing DOM Integration (The Wiring)

### Task 2: Implement Attribute Application

**Files:**
- Modify: `src/dom.js`

- [ ] **Step 1: Update `createNode` to apply attributes from `attrArena`**

```javascript
export function createNode(arena, idx, attrArena) {
  // ... existing creation ...
  const attrStart = arena[idx + SLOT_ATTR_START];
  if (attrStart !== -1 && attrArena) {
    for (let i = attrStart; attrArena[i] !== null; i += 2) {
      el.setAttribute(attrArena[i], attrArena[i + 1]);
    }
  }
  // ...
}
```

- [ ] **Step 2: Update `updateNode` to patch attributes**
Implement a simple "diff all" for attributes or clear/set for MVP.

---

### Task 3: Implement Element Replacement

- [ ] **Step 1: Update `updateNode` to handle tag changes**
If `newArena[idx + SLOT_DATA]` (tag name) != `oldArena[idx + SLOT_DATA]`:
1. Create new element.
2. Move children from old to new.
3. Replace old in DOM.
4. Update `domRefs[DOM_INDEX]`.

---

## Phase 3: Fulfilling the Zero-Recursion Promise

### Task 4: Iterative `mount()`

**Files:**
- Modify: `src/dom.js`

- [ ] **Step 1: Rewrite `mount()` using a stack loop**
Replace recursive calls with a while loop + stack to handle depth without stack-overflow risk.

---

## Phase 4: Intelligent Optimization

### Task 5: Automatic STATIC Flag Detection

**Files:**
- Modify: `src/parser.js`

- [ ] **Step 1: Implement static detection in the scanner**
A node is `STATIC` if:
1. It is a text node (for now).
2. It is an element where all descendants are also static and it has no dynamic bindings (placeholders).
*Note: Since v1.0 uses static strings, almost all nodes from `parse(literal)` should be flagged STATIC.*

- [ ] **Step 2: Update tests to verify `arena[idx + SLOT_FLAGS] & STATIC` is set**

---

## Phase 5: Memory & Stability

### Task 6: `domRefs` Lifecycle & Heap Fix

- [ ] **Step 1: Implement `domRefs` cleanup**
Removed nodes must have their indices cleared/reused in `domRefs` to prevent memory leaks.

- [ ] **Step 2: Refine `checkHeap` calculation**
Account for string lengths: `(arenaLen + attrLen) * 8 + (dataStringsTotalLength * 2)`.

---

## Phase 6: Verification

### Task 7: Final Torture Test & Benchmarking
- [ ] **Step 1: Run `npm test` and verify 100% pass rate**
- [ ] **Step 2: Verify `SUBTREE_SIZE` skip actually triggers in `morph`**
