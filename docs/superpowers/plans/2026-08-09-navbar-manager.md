# NavbarManager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `NavbarManager` in `src/entrypoints/share.content/navbar.ts` to unify operations (get, remove, insert) across both Navbar and Drawer navigation elements in Moodle 4.

**Architecture:** Create an internal `MenuItemNode` tree structure linking each item to its corresponding DOM elements in both `nav.navbar` and `#theme_boost-drawers-primary`. Expose unified methods `getItem`, `getRootItems`, `getAllItems`, `removeItem`, and `insertItem`.

**Tech Stack:** TypeScript, DOM APIs (vanilla JS), WXT content script environment.

## Global Constraints

- No external libraries for DOM manipulation.
- No git commits required per user instruction.
- No emojis, special symbols (like 【】, ☆), or markdown decorations in code comments.

---

### Task 1: Create Types and Interfaces

**Files:**
- Modify: `src/entrypoints/share.content/navbar.ts`

**Interfaces:**
- Produces: `MenuItemNode`, `CreateMenuItemOptions`

- [ ] **Step 1: Write interface and type definitions in `src/entrypoints/share.content/navbar.ts`**

```ts
export interface MenuItemNode {
  key: string;
  text: string;
  href?: string;
  isDropdown: boolean;
  parent: MenuItemNode | null;
  children: MenuItemNode[];
  elements: {
    navbar: HTMLElement | null;
    drawer: HTMLElement | null;
  };
}

export interface CreateMenuItemOptions {
  key?: string;
  text: string;
  href?: string;
  parentKey?: string;
  targetKey?: string;
  position?: 'before' | 'after';
  children?: CreateMenuItemOptions[];
}
```

---

### Task 2: Implement NavbarManager Class

**Files:**
- Modify: `src/entrypoints/share.content/navbar.ts`

**Interfaces:**
- Consumes: `MenuItemNode`, `CreateMenuItemOptions`
- Produces: `NavbarManager` class

- [ ] **Step 1: Implement `NavbarManager` class structure, constructor, and DOM parser**

Implement `parseExistingDOM` to parse existing elements in `nav.navbar` and `#theme_boost-drawers-primary` into `MenuItemNode` tree.

- [ ] **Step 2: Implement getter methods (`getItem`, `getRootItems`, `getAllItems`)**

- [ ] **Step 3: Implement `removeItem` method**

`removeItem` removes the matching elements from `navbar` and `drawer` DOM trees and updates the internal node map and parent/child arrays.

- [ ] **Step 4: Implement `insertItem` method and DOM element creation helpers**

`insertItem` creates both Navbar (HTML `li`/`a`) and Drawer (HTML `a`/`div.collapse`) elements, appends them to their respective parents or target positions, and updates internal node mappings.

---

### Task 3: Instantiate and Connect in `src/entrypoints/share.content/index.ts`

**Files:**
- Modify: `src/entrypoints/share.content/index.ts`

- [ ] **Step 1: Import and instantiate `NavbarManager` inside content script `main` entrypoint**

```ts
import { NavbarManager } from "./navbar";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  main(ctx) {
    const navbarManager = new NavbarManager();
  },
});
```
