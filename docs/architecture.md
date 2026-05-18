# FlatMorph: Deterministic DOM Runtime Design Spec

**Status:** Draft
**Date:** 2026-05-17
**Author:** FlatMorph Core Team

## 1. Vision & Positioning
FlatMorph is a **Low-Entropy Rendering Runtime** designed for deterministic heap behavior and high-throughput DOM patching in constrained environments (Low-RAM Android, Embedded Chromium, Kiosks).

Unlike traditional VDOMs, FlatMorph eliminates recursive object-tree traversal in favor of **linear arena iteration**.

### Key Differentiators:
- **Deterministic Heap:** Predictable memory footprint with configurable ceilings.
- **Flat Arena Architecture:** Sequential memory access for cache-friendly reconciliation.
- **Zero-Recursion:** Iterative morphing avoids stack-depth issues.
- **Streaming-Ready:** Single-pass char-scanner populates the arena without intermediate AST objects.

---

## 2. Core Architecture

### 2.1 The Flat Arena (Node Storage)
The Arena is a standard JavaScript Array where nodes are stored in fixed-size 8-slot segments.

**Node Slot Map (8 Slots):**
1. `TYPE`: Integer (0: Text, 1: Element, 2: Fragment).
2. `FLAGS`: Bitmask mutation hints (Independent powers of two).
3. `DATA`: Pointer/String for TagName or TextContent.
4. `FIRST_CHILD`: Arena index of the first child (-1 if none).
5. `NEXT_SIBLING`: Arena index of the next sibling (-1 if none).
6. `ATTR_START`: Index in the `attributeArena`.
7. `DOM_INDEX`: Pointer to the external `domRefs` table.
8. `SUBTREE_SIZE`: Number of arena slots occupied by this node and its descendants (Enables O(1) subtree skipping).

### 2.2 External DOM Reference Table
To maintain a clean numeric/string arena and prevent GC fragmentation, DOM references are stored in a simple external array:
```javascript
const domRefs = []; // domRefs[node.DOM_INDEX] => real DOM node
```

### 2.3 Bitmask Specification
```javascript
const T_CHG  = 1 << 0; // Text content changed
const A_CHG  = 1 << 1; // Attributes changed
const S_CHG  = 1 << 2; // Style changed
const E_CHG  = 1 << 3; // Event replacement (Opaque)
const D_CHG  = 1 << 4; // Dynamic structure
const STATIC = 1 << 5; // Static subtree (Skip entirely)
```

---

## 3. Subsystems

### 3.1 Template Scanner (The Parser)
A char-by-char scanner (`charCodeAt`) that transforms template strings directly into Arena tuples.
- **O(1) Static Detection:** Identifies segments without bindings during the scan and flags them as `STATIC`.
- **Allocation Stable:** Avoids Regex match arrays and intermediate token objects.

### 3.2 Morph Engine (The Reconciler)
Iterative loop that compares the current Arena against the next state.
- **Jump Optimization:** If `node.FLAGS & STATIC`, the morpher jumps `i += node.SUBTREE_SIZE`, skipping the entire subtree.
- **Opaque Events:** Event listeners are treated as simple replacements (`onclick = fn`) to minimize internal state management.

---

## 4. Constraints & Scope (v1.0)
- **Target Size:** <2KB gzipped.
- **No Keyed Diffing:** Positional diffing only for MVP to prioritize stability and size.
- **No Proxy/Reactivity:** Pure deterministic rendering.
- **Zero Dependencies:** Raw JS only.

---

## 5. Verification & Benchmark Strategy
- **Heap Peak Test:** Measure maximum heap usage during 10,000 rapid updates.
- **Low-End Torture Test:** Benchmark input latency on throttled CPU profiles.
- **GC Pulse Audit:** Track garbage collection pauses compared to React/Preact.
- **Static Skipping Benchmark:** Measure performance gain on large pages with sparse dynamic data.
