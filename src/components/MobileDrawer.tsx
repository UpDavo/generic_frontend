import { Button, Drawer } from "@mantine/core";
import Link from "next/link";
import { MobileDrawerProps } from "@/interfaces/navigation";

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  routes,
  drawerOpened,
  setDrawerOpened,
  handleLogout,
}) => (
  <Drawer
    opened={drawerOpened}
    onClose={() => setDrawerOpened(false)}
    title="Dashboard"
    padding="xl"
  >
    <nav>
      <ul>
        {routes.map((route) => (
          <li key={route.path}>
            <Link
              href={route.path}
              className="block py-2"
              onClick={() => setDrawerOpened(false)}
            >
              {route.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    <Button onClick={handleLogout} className="mt-6 bg-red-500 hover:bg-red-600">
      Logout
    </Button>
  </Drawer>
);

export default MobileDrawer;
