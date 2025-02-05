export interface Route {
  path: string;
  name: string;
}

export interface SidebarProps {
  routes: Route[];
  handleLogout: () => void;
}

export interface MobileDrawerProps {
  routes: Route[];
  drawerOpened: boolean;
  setDrawerOpened: (open: boolean) => void;
  handleLogout: () => void;
}
