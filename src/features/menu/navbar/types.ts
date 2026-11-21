export interface NewMenuItem {
  text: string;
  href: string;
  newTab?: boolean;
}

export interface MenuConfig {
  hidden?: string[];
  items?: NewMenuItem[];
}
