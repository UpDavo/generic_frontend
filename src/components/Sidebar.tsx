"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button, Box } from "@mantine/core";
import { SidebarProps } from "@/interfaces/navigation";

const Sidebar: React.FC<SidebarProps> = ({ routes, handleLogout, user }) => {
  const pathname = usePathname();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const currentIndex = routes.findIndex((route) => route.path === pathname);
    if (currentIndex !== -1) {
      setActive(currentIndex);
    }
  }, [pathname, routes]);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-neutral text-white px-6 py-6 shadow-lg">
      {/* <h2 className="text-3xl font-bold text-white mb-4">Dashboard</h2> */}

      {/* Botón de perfil */}
      {user && (
        <div className="flex flex-col items-center justify-center mb-6 mt-3">
          <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold uppercase">
            {user.first_name.charAt(0)}
          </div>
          <p className="mt-2 text-lg font-semibold">{user.first_name} {user.last_name}</p>
          <p className="text-sm text-gray-300">{user.role?.name}</p>
          <Link href="/dashboard/profile" passHref>
            <Button
              // variant="light"
              className="mt-2 btn btn-info btn-block text-white"
            >
              Ver Perfil
            </Button>
          </Link>
        </div>
      )}

      {/* Navegación */}
      <nav className="mt-2">
        <Box w={200}>
          {routes.map((route, index) => (
            <Link key={route.path} href={route.path} passHref>
              <div
                className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                  index === active
                    ? "bg-info text-white"
                    : "text-gray-300 hover:bg-primary hover:text-white"
                }`}
                onClick={() => setActive(index)}
              >
                {route.name}
              </div>
            </Link>
          ))}
        </Box>
      </nav>

      {/* Botón de logout */}
      <Button
        onClick={handleLogout}
        className="mt-auto bg-info hover:bg-error transition-all duration-300 text-white font-bold py-2 px-4 rounded"
      >
        Logout
      </Button>
    </aside>
  );
};

export default Sidebar;
