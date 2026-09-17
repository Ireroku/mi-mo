import type { MenuAdapter, NewMenuItem } from "./types";

export class NavbarAdapter implements MenuAdapter {
  private container: HTMLElement | null = null;

  constructor() {
    this.refreshContainer();
  }

  private refreshContainer(): HTMLElement | null {
    if (!this.container || !this.container.isConnected) {
      this.container = document.querySelector<HTMLElement>(
        "nav.navbar ul.more-nav, nav.navbar ul.navbar-nav"
      );
    }
    return this.container;
  }

  get isReady(): boolean {
    this.refreshContainer();
    return Boolean(this.container);
  }

  private matchesTarget(el: HTMLElement, target: string): boolean {
    if (!target) {
      return false;
    }

    const targetLower = target.toLowerCase().trim();

    // Check data-key attribute (case-insensitive or exact)
    const dataKey = el.getAttribute("data-key");
    if (dataKey && (dataKey === target || dataKey.toLowerCase() === targetLower)) {
      return true;
    }

    // Check inner anchor href
    // If the element has a dropdown menu, check only its primary toggle link
    // to avoid matching sub-items and hiding the entire dropdown.
    const dropdownMenu = el.querySelector(".dropdown-menu");
    const primaryAnchor =
      el instanceof HTMLAnchorElement
        ? el
        : el.querySelector<HTMLAnchorElement>(":scope > a, a.nav-link, a");

    if (
      primaryAnchor &&
      primaryAnchor.href &&
      (primaryAnchor.href.includes(target) ||
        primaryAnchor.href.toLowerCase().includes(targetLower))
    ) {
      return true;
    }

    if (!dropdownMenu) {
      const anchors = el.querySelectorAll<HTMLAnchorElement>("a");
      for (const anchor of anchors) {
        if (
          anchor.href &&
          (anchor.href.includes(target) ||
            anchor.href.toLowerCase().includes(targetLower))
        ) {
          return true;
        }
      }
    }

    // Check normalized textContent
    // For elements with a dropdown menu, check only the primary link text.
    let text = el.textContent?.trim().toLowerCase();
    if (dropdownMenu && primaryAnchor) {
      text = primaryAnchor.textContent?.trim().toLowerCase();
    }

    if (text && text.includes(targetLower)) {
      return true;
    }

    return false;
  }

  hideItem(target: string): boolean {
    if (!this.container || !this.container.isConnected) {
      this.refreshContainer();
    }
    if (!this.container) {
      return false;
    }

    let found = false;

    // Search top-level items
    const topLevelItems = this.container.querySelectorAll<HTMLElement>(":scope > li.nav-item");
    for (const li of topLevelItems) {
      if (this.matchesTarget(li, target)) {
        li.setAttribute("data-mimo-hidden", "true");
        found = true;
      }
    }

    // Search dropdown sub-items
    const dropdownItems = this.container.querySelectorAll<HTMLElement>(".dropdown-menu a.dropdown-item");
    for (const item of dropdownItems) {
      if (this.matchesTarget(item, target)) {
        item.setAttribute("data-mimo-hidden", "true");
        found = true;
      }
    }

    return found;
  }

  insertItem(item: NewMenuItem): boolean {
    if (!this.container || !this.container.isConnected) {
      this.refreshContainer();
    }
    if (!this.container) {
      return false;
    }

    const li = document.createElement("li");
    li.className = "nav-item";
    li.setAttribute("role", "none");

    const a = document.createElement("a");
    a.setAttribute("role", "menuitem");
    a.className = "nav-link";
    a.href = item.href;
    a.textContent = item.text;

    if (item.newTab) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    li.appendChild(a);

    let inserted = false;

    if (item.position) {
      const topLevelItems = this.container.querySelectorAll<HTMLElement>(":scope > li.nav-item");
      let targetEl: HTMLElement | null = null;
      for (const el of topLevelItems) {
        if (this.matchesTarget(el, item.position.target)) {
          targetEl = el;
          break;
        }
      }

      if (targetEl) {
        if (item.position.where === "before") {
          this.container.insertBefore(li, targetEl);
          inserted = true;
        } else if (item.position.where === "after") {
          this.container.insertBefore(li, targetEl.nextSibling);
          inserted = true;
        }
      }
    }

    if (!inserted) {
      const moreMenuEl = this.container.querySelector<HTMLElement>("li.dropdownmoremenu");
      if (moreMenuEl) {
        this.container.insertBefore(li, moreMenuEl);
      } else {
        this.container.appendChild(li);
      }
    }

    return true;
  }
}
