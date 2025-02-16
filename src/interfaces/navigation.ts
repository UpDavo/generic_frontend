import { User } from "@/interfaces/user";

export interface Route {
  path: string;
  name: string;
}

export interface SidebarProps {
  routes: Route[];
}

export interface MobileDrawerProps {
  routes: Route[];
  drawerOpened: boolean;
  setDrawerOpened: (open: boolean) => void;
  user?: User | null;
}
