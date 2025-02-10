import { User } from "@/interfaces/user";

export interface Route {
  path: string;
  name: string;
}

export interface SidebarProps {
  routes: Route[];
  handleLogout: () => void;
  user?: User | null;
}

export interface MobileDrawerProps {
  routes: Route[];
  drawerOpened: boolean;
  setDrawerOpened: (open: boolean) => void;
  handleLogout: () => void;
  user?: User | null;
}
