import { User } from "@/core/interfaces/user";

export interface Route {
  path: string;
  name: string;
  permission?: string;
}

export interface RouteGroup {
  name: string;
  children: Route[];
}

export type SidebarRoute = Route | RouteGroup;

export interface SidebarProps {
  routes: any[];
}

export interface DrawerProps {
  routes: any;
  drawerOpened: boolean;
  setDrawerOpened: (open: boolean) => void;
  user?: User | null;
}
