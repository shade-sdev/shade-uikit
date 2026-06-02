export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string | number;
  children?: NavItem[];
  visible?: boolean;
  external?: boolean;
  /**
   * If set, the item is only rendered for users who have at least one of
   * these roles. Omit to show the item to all authenticated users.
   */
  roles?: string[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface LogoConfig {
  icon: string;
  name: string;
  subtitle?: string;
}
