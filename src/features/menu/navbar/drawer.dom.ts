import type { MenuAdapter, NewMenuItem } from "./types";

export class DrawerAdapter implements MenuAdapter {
  private container: HTMLElement | null = null;

  constructor() {
    this.refreshContainer();
  }

  private refreshContainer(): HTMLElement | null {
    if (!this.container || !this.container.isConnected) {
      this.container = document.querySelector<HTMLElement>(
        "#theme_boost-drawers-primary .drawercontent .list-group, #theme_boost-drawers-primary .list-group"
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

    if (el.classList.contains("collapse")) {
      return false;
    }

    const targetLower = target.toLowerCase().trim();
    if (!targetLower) {
      return false;
    }

    // Check data-key attribute if present
    const dataKey = el.getAttribute("data-key");
    if (dataKey && (dataKey === target || dataKey.toLowerCase() === targetLower)) {
      return true;
    }

    // Check inner anchor href
    const primaryAnchor =
      el instanceof HTMLAnchorElement
        ? el
        : el.querySelector<HTMLAnchorElement>(":scope > a, a");

    if (primaryAnchor) {
      const hrefAttr = primaryAnchor.getAttribute("href");
      if (hrefAttr && hrefAttr !== "#" && !hrefAttr.startsWith("#")) {
        if (
          primaryAnchor.href.includes(target) ||
          primaryAnchor.href.toLowerCase().includes(targetLower) ||
          hrefAttr.includes(target) ||
          hrefAttr.toLowerCase().includes(targetLower)
        ) {
          return true;
        }
      }
    }

    // Check normalized textContent without child collapse menus or screen reader text
    let text = "";
    if (el.children.length === 0) {
      text = el.textContent ?? "";
    } else {
      const clone = el.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll(".collapse, .sr-only, .visually-hidden")
        .forEach((node) => node.remove());
      text = clone.textContent ?? "";
    }

    // Strip or replace screen reader labels
    text = text
      .replace(/折りたたむ/g, "")
      .replace(/展開する/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (text && text.includes(targetLower)) {
      return true;
    }

    return false;
  }

  private findCollapseForHiding(el: HTMLElement): HTMLElement | null {
    const isToggle =
      el.getAttribute("data-toggle") === "collapse" ||
      el.getAttribute("data-bs-toggle") === "collapse" ||
      el.hasAttribute("data-target") ||
      el.hasAttribute("data-bs-target") ||
      el.nextElementSibling?.classList.contains("collapse");
    if (!isToggle) return null;

    const targetSelector =
      el.getAttribute("data-target") || el.getAttribute("data-bs-target");
    let collapseEl: HTMLElement | null = null;
    if (targetSelector && targetSelector.startsWith("#")) {
      collapseEl =
        this.container?.querySelector<HTMLElement>(targetSelector) ||
        document.querySelector<HTMLElement>(targetSelector);
    }

    if (!collapseEl && el.nextElementSibling?.classList.contains("collapse")) {
      collapseEl = el.nextElementSibling as HTMLElement;
    }

    if (!collapseEl) {
      const ariaControls = el.getAttribute("aria-controls");
      if (ariaControls) collapseEl = document.getElementById(ariaControls);
    }
    return collapseEl;
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
    const topLevelItems = Array.from(this.container.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && !child.classList.contains("collapse")
    );

    for (const el of topLevelItems) {
      if (this.matchesTarget(el, target)) {
        el.setAttribute("data-mimo-hidden", "true");
        found = true;

        this.findCollapseForHiding(el)?.setAttribute("data-mimo-hidden", "true");
      }
    }

    // Search sub-items inside all collapse containers
    const subItems = this.container.querySelectorAll<HTMLElement>(
      ".collapse a.list-group-item"
    );
    for (const subItem of subItems) {
      if (this.matchesTarget(subItem, target)) {
        subItem.setAttribute("data-mimo-hidden", "true");
        found = true;
      }
    }

    return found;
  }

  private referenceAfterItem(targetEl: HTMLElement): Node | null {
    const nextEl = targetEl.nextElementSibling;
    if (nextEl?.classList.contains("collapse")) return nextEl.nextSibling;

    const targetSelector =
      targetEl.getAttribute("data-target") || targetEl.getAttribute("data-bs-target");
    if (targetSelector && targetSelector.startsWith("#")) {
      const collapseTarget = this.container?.querySelector<HTMLElement>(targetSelector);
      if (collapseTarget?.classList.contains("collapse")) {
        return collapseTarget.nextSibling;
      }
    }
    return targetEl.nextSibling;
  }

  insertItem(item: NewMenuItem): boolean {
    if (!this.container || !this.container.isConnected) {
      this.refreshContainer();
    }
    if (!this.container) {
      return false;
    }

    const a = document.createElement("a");
    a.className = "list-group-item list-group-item-action";
    a.href = item.href;
    a.textContent = item.text;

    if (item.newTab) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    let inserted = false;

    if (item.position) {
      const topLevelItems = Array.from(this.container.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && !child.classList.contains("collapse")
      );

      let targetEl: HTMLElement | null = null;
      for (const el of topLevelItems) {
        if (this.matchesTarget(el, item.position.target)) {
          targetEl = el;
          break;
        }
      }

      if (targetEl) {
        if (item.position.where === "before") {
          this.container.insertBefore(a, targetEl);
          inserted = true;
        } else if (item.position.where === "after") {
          this.container.insertBefore(a, this.referenceAfterItem(targetEl));
          inserted = true;
        }
      }
    }

    if (!inserted) {
      this.container.appendChild(a);
    }

    return true;
  }
}
