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
  position?: "before" | "after";
  children?: CreateMenuItemOptions[];
}

export class NavbarManager {
  private navbarContainer: HTMLElement | null;
  private drawerContainer: HTMLElement | null;
  private nodeMap: Map<string, MenuItemNode> = new Map();
  private rootNodes: MenuItemNode[] = [];

  constructor(
    navbarSelector = "nav.navbar",
    drawerSelector = "#theme_boost-drawers-primary"
  ) {
    this.navbarContainer = document.querySelector(navbarSelector);
    this.drawerContainer = document.querySelector(drawerSelector);
    this.parseExistingDOM();
  }

  /**
   * キー指定で要素ノードを取得
   */
  getItem(key: string): MenuItemNode | undefined {
    return this.nodeMap.get(key);
  }

  /**
   * ルート直下の要素リストを取得
   */
  getRootItems(): MenuItemNode[] {
    return [...this.rootNodes];
  }

  /**
   * 登録されている全要素リストを取得
   */
  getAllItems(): MenuItemNode[] {
    return Array.from(this.nodeMap.values());
  }

  /**
   * キー指定で要素を Navbar と Drawer から削除
   */
  removeItem(key: string): boolean {
    const node = this.nodeMap.get(key);
    if (!node) return false;

    // 子要素も再帰的に削除
    for (const child of [...node.children]) {
      this.removeItem(child.key);
    }

    // DOMから削除
    if (node.elements.navbar) {
      node.elements.navbar.remove();
    }
    if (node.elements.drawer) {
      node.elements.drawer.remove();
    }

    // 親要素からのリンク解除
    if (node.parent) {
      node.parent.children = node.parent.children.filter((c) => c !== node);
    } else {
      this.rootNodes = this.rootNodes.filter((n) => n !== node);
    }

    this.nodeMap.delete(key);
    return true;
  }

  /**
   * 要素の追加・挿入
   */
  insertItem(options: CreateMenuItemOptions): MenuItemNode {
    const key = options.key || this.generateKey(options.text);
    if (this.nodeMap.has(key)) {
      throw new Error(`MenuItem with key "${key}" already exists.`);
    }

    const isDropdown = Boolean(options.children && options.children.length > 0);
    const parentNode = options.parentKey ? this.nodeMap.get(options.parentKey) || null : null;

    // Navbar 要素の構築
    const navbarEl = this.createNavbarDOM(key, options, isDropdown, parentNode);

    // Drawer 要素の構築
    const drawerEl = this.createDrawerDOM(key, options, isDropdown, parentNode);

    const newNode: MenuItemNode = {
      key,
      text: options.text,
      href: options.href,
      isDropdown,
      parent: parentNode,
      children: [],
      elements: {
        navbar: navbarEl,
        drawer: drawerEl,
      },
    };

    // DOMへの挿入
    this.appendOrInsertDOM(newNode, options, parentNode);

    // 内部ツリーへの追加
    if (parentNode) {
      parentNode.children.push(newNode);
    } else {
      this.rootNodes.push(newNode);
    }
    this.nodeMap.set(key, newNode);

    // 子要素の再帰追加
    if (options.children && options.children.length > 0) {
      for (const childOptions of options.children) {
        this.insertItem({
          ...childOptions,
          parentKey: key,
        });
      }
    }

    return newNode;
  }

  /**
   * 既存のDOM構造を解析して内部状態を初期化
   */
  private parseExistingDOM(): void {
    if (!this.navbarContainer && !this.drawerContainer) return;

    // Navbar の解析
    const navbarNav = this.navbarContainer?.querySelector(
      "ul.more-nav, ul.navbar-nav"
    );
    if (navbarNav) {
      const topItems = navbarNav.querySelectorAll(":scope > li.nav-item");
      topItems.forEach((li) => {
        const htmlLi = li as HTMLElement;
        const dataKey = htmlLi.getAttribute("data-key");
        const link = htmlLi.querySelector("a");
        const text =
          link?.textContent?.trim() || htmlLi.textContent?.trim() || "";
        const href = link?.getAttribute("href") || undefined;
        const isDropdown = htmlLi.classList.contains("dropdown");
        const key = dataKey || this.generateKey(text);

        const node: MenuItemNode = {
          key,
          text,
          href,
          isDropdown,
          parent: null,
          children: [],
          elements: {
            navbar: htmlLi,
            drawer: null,
          },
        };

        this.rootNodes.push(node);
        this.nodeMap.set(key, node);

        // ドロップダウン内の子要素解析
        if (isDropdown) {
          const dropdownMenu = htmlLi.querySelector(".dropdown-menu");
          if (dropdownMenu) {
            const childItems = dropdownMenu.querySelectorAll("a.dropdown-item");
            childItems.forEach((item) => {
              const htmlItem = item as HTMLElement;
              const childText = htmlItem.textContent?.trim() || "";
              const childHref = htmlItem.getAttribute("href") || undefined;
              const childKey = `${key}/${this.generateKey(childText)}`;

              const childNode: MenuItemNode = {
                key: childKey,
                text: childText,
                href: childHref,
                isDropdown: false,
                parent: node,
                children: [],
                elements: {
                  navbar: htmlItem,
                  drawer: null,
                },
              };

              node.children.push(childNode);
              this.nodeMap.set(childKey, childNode);
            });
          }
        }
      });
    }

    // Drawer の解析とマッチング
    if (this.drawerContainer) {
      const drawerListGroup = this.drawerContainer.querySelector(
        ".drawercontent .list-group"
      );
      if (drawerListGroup) {
        const drawerElements = Array.from(
          drawerListGroup.children
        ) as HTMLElement[];
        let currentParentNode: MenuItemNode | null = null;

        drawerElements.forEach((el) => {
          if (el.tagName === "A") {
            const text =
              el.textContent
                ?.trim()
                .replace(/(折りたたむ|展開する)/, "")
                .trim() || "";
            const href = el.getAttribute("href") || undefined;
            const isCollapseToggle =
              el.hasAttribute("data-toggle") &&
              el.getAttribute("data-toggle") === "collapse";

            // rootNodes または nodeMap から対応するノードを検索
            let matchedNode = this.findMatchingNode(text, href);

            if (!matchedNode) {
              const key = this.generateKey(text);
              matchedNode = {
                key,
                text,
                href,
                isDropdown: isCollapseToggle,
                parent: null,
                children: [],
                elements: {
                  navbar: null,
                  drawer: el,
                },
              };
              this.rootNodes.push(matchedNode);
              this.nodeMap.set(key, matchedNode);
            } else {
              matchedNode.elements.drawer = el;
            }

            if (isCollapseToggle) {
              currentParentNode = matchedNode;
            } else {
              currentParentNode = null;
            }
          } else if (el.classList.contains("collapse") && currentParentNode) {
            // アコーディオン内部の子要素
            const childItems = el.querySelectorAll("a.list-group-item");
            childItems.forEach((childEl) => {
              const htmlChild = childEl as HTMLElement;
              const childText = htmlChild.textContent?.trim() || "";
              const childHref = htmlChild.getAttribute("href") || undefined;

              // 親ノードの子要素から一致するものを検索
              let childNode = currentParentNode?.children.find(
                (c) => c.text === childText || (childHref && c.href === childHref)
              );

              if (!childNode) {
                const childKey = `${currentParentNode?.key}/${this.generateKey(
                  childText
                )}`;
                childNode = {
                  key: childKey,
                  text: childText,
                  href: childHref,
                  isDropdown: false,
                  parent: currentParentNode,
                  children: [],
                  elements: {
                    navbar: null,
                    drawer: htmlChild,
                  },
                };
                currentParentNode?.children.push(childNode);
                this.nodeMap.set(childKey, childNode);
              } else {
                childNode.elements.drawer = htmlChild;
              }
            });
          }
        });
      }
    }
  }

  /**
   * テキストやURLから既存のノードを検索
   */
  private findMatchingNode(
    text: string,
    href?: string
  ): MenuItemNode | undefined {
    for (const node of this.nodeMap.values()) {
      if (node.text === text || (href && href !== "#" && node.href === href)) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Navbar 用の HTML 要素を生成
   */
  private createNavbarDOM(
    key: string,
    options: CreateMenuItemOptions,
    isDropdown: boolean,
    parent: MenuItemNode | null
  ): HTMLElement {
    if (parent) {
      // ドロップダウン内のアイテム
      const a = document.createElement("a");
      a.className = "dropdown-item";
      a.setAttribute("role", "menuitem");
      a.href = options.href || "#";
      a.tabIndex = -1;
      a.textContent = options.text;
      return a;
    }

    if (isDropdown) {
      // トップレベルのドロップダウン
      const li = document.createElement("li");
      li.className = "dropdown nav-item";
      li.setAttribute("role", "none");
      li.setAttribute("data-key", key);

      const dropdownId = `dropdown-${key}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const menuId = `dropdown-menu-${key}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const a = document.createElement("a");
      a.className = "dropdown-toggle nav-link";
      a.id = dropdownId;
      a.setAttribute("role", "menuitem");
      a.setAttribute("data-toggle", "dropdown");
      a.setAttribute("aria-haspopup", "true");
      a.setAttribute("aria-expanded", "false");
      a.href = options.href || "#";
      a.setAttribute("aria-controls", menuId);
      a.tabIndex = -1;
      a.textContent = options.text;

      const menuDiv = document.createElement("div");
      menuDiv.className = "dropdown-menu";
      menuDiv.setAttribute("role", "menu");
      menuDiv.id = menuId;
      menuDiv.setAttribute("aria-labelledby", dropdownId);

      li.appendChild(a);
      li.appendChild(menuDiv);
      return li;
    }

    // 通常のトップレベルリンク
    const li = document.createElement("li");
    li.className = "nav-item";
    li.setAttribute("role", "none");
    li.setAttribute("data-key", key);

    const a = document.createElement("a");
    a.className = "nav-link";
    a.setAttribute("role", "menuitem");
    a.href = options.href || "#";
    a.tabIndex = -1;
    a.textContent = options.text;

    li.appendChild(a);
    return li;
  }

  /**
   * Drawer 用の HTML 要素を生成
   */
  private createDrawerDOM(
    key: string,
    options: CreateMenuItemOptions,
    isDropdown: boolean,
    parent: MenuItemNode | null
  ): HTMLElement {
    if (parent) {
      // アコーディオン内のリンク
      const a = document.createElement("a");
      a.className = "ps-5 bg-light list-group-item list-group-item-action";
      a.href = options.href || "#";
      a.tabIndex = -1;
      a.textContent = options.text;
      return a;
    }

    if (isDropdown) {
      // アコーディオンの親容器
      const wrapper = document.createElement("div");
      wrapper.className = "drawer-accordion-group";

      const collapseId = `drop-down-menu-${key}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const toggleId = `drop-down-${key}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const a = document.createElement("a");
      a.id = toggleId;
      a.href = options.href || "#";
      a.className =
        "list-group-item list-group-item-action icons-collapse-expand d-flex collapsed";
      a.setAttribute("data-toggle", "collapse");
      a.setAttribute("data-target", `#${collapseId}`);
      a.setAttribute("aria-expanded", "false");
      a.setAttribute("aria-controls", collapseId);
      a.tabIndex = -1;
      a.textContent = options.text;

      const collapseDiv = document.createElement("div");
      collapseDiv.className = "collapse list-group-item p-0 border-0";
      collapseDiv.id = collapseId;
      collapseDiv.setAttribute("role", "menu");
      collapseDiv.setAttribute("aria-labelledby", toggleId);

      wrapper.appendChild(a);
      wrapper.appendChild(collapseDiv);
      return wrapper;
    }

    // 通常のドロワリンク
    const a = document.createElement("a");
    a.className = "list-group-item list-group-item-action";
    a.href = options.href || "#";
    a.tabIndex = -1;
    a.textContent = options.text;
    return a;
  }

  /**
   * DOM 要素をターゲット位置に挿入
   */
  private appendOrInsertDOM(
    node: MenuItemNode,
    options: CreateMenuItemOptions,
    parent: MenuItemNode | null
  ): void {
    // 1. Navbar への追加・挿入
    if (node.elements.navbar) {
      if (parent) {
        // 親の dropdown-menu に追加
        const dropdownMenu =
          parent.elements.navbar?.querySelector(".dropdown-menu");
        if (dropdownMenu) {
          dropdownMenu.appendChild(node.elements.navbar);
        }
      } else {
        const navbarNav = this.navbarContainer?.querySelector(
          "ul.more-nav, ul.navbar-nav"
        );
        if (navbarNav) {
          const targetNode = options.targetKey
            ? this.nodeMap.get(options.targetKey)
            : null;
          if (targetNode?.elements.navbar) {
            if (options.position === "before") {
              navbarNav.insertBefore(
                node.elements.navbar,
                targetNode.elements.navbar
              );
            } else {
              navbarNav.insertBefore(
                node.elements.navbar,
                targetNode.elements.navbar.nextSibling
              );
            }
          } else {
            navbarNav.appendChild(node.elements.navbar);
          }
        }
      }
    }

    // 2. Drawer への追加・挿入
    if (node.elements.drawer) {
      if (parent) {
        // 親のアコーディオン collapseDiv に追加
        let collapseDiv: HTMLElement | null = null;
        if (
          parent.elements.drawer?.classList.contains("drawer-accordion-group")
        ) {
          collapseDiv = parent.elements.drawer.querySelector(".collapse");
        } else if (parent.elements.drawer) {
          // 既存DOMから解析されたアコーディオンの場合、次の要素が collapseDiv
          collapseDiv = parent.elements.drawer
            .nextElementSibling as HTMLElement;
        }

        if (collapseDiv) {
          collapseDiv.appendChild(node.elements.drawer);
        }
      } else {
        const drawerListGroup = this.drawerContainer?.querySelector(
          ".drawercontent .list-group"
        );
        if (drawerListGroup) {
          const targetNode = options.targetKey
            ? this.nodeMap.get(options.targetKey)
            : null;
          if (targetNode?.elements.drawer) {
            if (options.position === "before") {
              drawerListGroup.insertBefore(
                node.elements.drawer,
                targetNode.elements.drawer
              );
            } else {
              const insertRef = targetNode.elements.drawer.nextElementSibling;
              drawerListGroup.insertBefore(node.elements.drawer, insertRef);
            }
          } else {
            drawerListGroup.appendChild(node.elements.drawer);
          }
        }
      }
    }
  }

  /**
   * テキストからキーを生成
   */
  private generateKey(text: string): string {
    return (
      text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") ||
      `item-${Math.random().toString(36).substring(2, 8)}`
    );
  }
}
