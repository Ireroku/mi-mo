import type { MenuAdapter, MenuConfig, NewMenuItem } from "./types";
import { NavbarAdapter } from "./primaryNav.dom";
import { DrawerAdapter } from "./drawer.dom";
import { applyStyleSheet } from "@/utils/styleSheet";

export class MenuManager {
  private adapters: MenuAdapter[];

  constructor(
    adapters: MenuAdapter[] = [new NavbarAdapter(), new DrawerAdapter()],
  ) {
    this.adapters = adapters;
  }

  /**
   * Applies the menu configuration to all adapters.
   */
  applyConfig(config: MenuConfig): void {
    applyStyleSheet(
      "mimo-menu-style",
      "[data-mimo-hidden] { display: none !important; }",
    );

    const apply = () => {
      if (config.hidden) {
        for (const target of config.hidden) {
          this.hideItem(target);
        }
      }

      if (config.items) {
        for (const item of config.items) {
          this.insertItem(item);
        }
      }
    };

    apply();

    // If adapters are not yet ready and DOM is still loading, re-apply once DOM is ready
    const allReady = this.adapters.every((adapter) => adapter.isReady);
    if (!allReady && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => apply(), {
        once: true,
      });
    }
  }

  /**
   * Hides menu items matching the target across all adapters.
   * Returns true if at least one adapter hid an item.
   */
  hideItem(target: string): boolean {
    let result = false;
    for (const adapter of this.adapters) {
      if (adapter.hideItem(target)) {
        result = true;
      }
    }
    return result;
  }

  /**
   * Inserts a new menu item across all adapters.
   * Returns true if at least one adapter inserted the item.
   */
  insertItem(item: NewMenuItem): boolean {
    let result = false;
    for (const adapter of this.adapters) {
      if (adapter.insertItem(item)) {
        result = true;
      }
    }
    return result;
  }
}

export { MenuManager as NavbarManager };
export * from "./types";
