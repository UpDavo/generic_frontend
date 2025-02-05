import { Button, Box, Drawer } from "@mantine/core";
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
    className="text-white bg-base-100"
  >
    <nav className="px-2">
      <Box w="100%">
        <h1 className="text-neutral text-3xl font-bold mb-5">Menu</h1>
        {routes.map((route) => (
          <Link key={route.path} href={route.path} passHref>
            <div
              className="cursor-pointer mt-2 px-4 py-2 rounded text-base-100 bg-info"
              onClick={() => setDrawerOpened(false)}
            >
              {route.name}
            </div>
          </Link>
        ))}
        <Button
          onClick={handleLogout}
          className="mt-6 bg-info hover:bg-error transition-all duration-300 text-white font-bold py-2 px-4 rounded w-full"
        >
          Logout
        </Button>
      </Box>
    </nav>
  </Drawer>
);

export default MobileDrawer;
