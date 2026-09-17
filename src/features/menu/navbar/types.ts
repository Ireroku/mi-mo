export interface InsertPosition {
  target: string;
  where: "before" | "after";
}

export interface NewMenuItem {
  text: string;
  href: string;
  newTab?: boolean;
  position?: InsertPosition;
}

export interface MenuConfig {
  hidden?: string[];
  items?: NewMenuItem[];
}

export interface MenuAdapter {
  readonly isReady: boolean;
  hideItem(target: string): boolean;
  insertItem(item: NewMenuItem): boolean;
}
