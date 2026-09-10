# NavbarManager Design Spec

## Overview
`NavbarManager` is a TypeScript class that unifies control over both the top Navigation Bar (`nav.navbar`) and the Side Panel Drawer (`#theme_boost-drawers-primary`) in Moodle 4.
It maintains an internal tree structure (`MenuItemNode`) linking each item to its corresponding DOM elements in both places, enabling simultaneous retrieval, insertion, and deletion of navigation elements (including dropdown/accordion sub-items).

## Data Models

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

## Class Interface

```ts
export class NavbarManager {
  private navbarContainer: HTMLElement | null;
  private drawerContainer: HTMLElement | null;
  private nodeMap: Map<string, MenuItemNode>;
  private rootNodes: MenuItemNode[];

  constructor(
    navbarSelector?: string,
    drawerSelector?: string
  );

  /**
   * Retrieves a MenuItemNode by its key, or fetches all root / all registered nodes.
   */
  getItem(key: string): MenuItemNode | undefined;
  getRootItems(): MenuItemNode[];
  getAllItems(): MenuItemNode[];

  /**
   * Deletes the item identified by `key` from both Navbar and Drawer DOMs as well as the internal tree map.
   */
  removeItem(key: string): boolean;

  /**
   * Inserts a new menu item or dropdown tree into both Navbar and Drawer DOMs.
   */
  insertItem(options: CreateMenuItemOptions): MenuItemNode;
}
```

## Implementation Details

1. **DOM Parsing (`parseExistingDOM`)**:
   - Parses existing HTML elements in `nav.navbar` (`ul.more-nav`) and `#theme_boost-drawers-primary` (`.drawercontent .list-group`).
   - Maps `data-key` or normalized text strings to `key` identifiers for nodes.
   - Pairs corresponding items between Navbar and Drawer.

2. **DOM Synchronization**:
   - `insertItem`: Builds `li.nav-item`/`a.dropdown-item` for Navbar and `a.list-group-item` (or collapse accordion) for Drawer.
   - `removeItem`: Calls `remove()` on both `elements.navbar` and `elements.drawer`, cleans up child references, and deletes entries from `nodeMap`.
