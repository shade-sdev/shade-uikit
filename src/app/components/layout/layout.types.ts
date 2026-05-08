export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string | number;
  children?: NavItem[];
  visible?: boolean;
  external?: boolean;
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
