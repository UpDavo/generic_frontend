"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box } from "@mantine/core";
import { SidebarProps } from "@/interfaces/navigation";

const Sidebar: React.FC<SidebarProps & { user: any }> = ({ routes, user }) => {
  const pathname = usePathname();
  const [active, setActive] = useState(0);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const currentIndex = routes.findIndex((route) => route.path === pathname);
    if (currentIndex !== -1) {
      setActive(currentIndex);
    }

    // Abrir automáticamente el submenu si el path coincide
    const newOpenSubmenus: { [key: string]: boolean } = {};
    routes.forEach((route) => {
      if (route.children) {
        const isChildActive = route.children.some((child: any) =>
          pathname.startsWith(child.path)
        );
        newOpenSubmenus[route.name] = isChildActive;
      }
    });
    setOpenSubmenus(newOpenSubmenus);
  }, [pathname, routes]);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Filtrar rutas según permisos del usuario o si es admin
  const userPermissions =
    user?.role?.permissions?.map((perm: any) => perm.path) || [];
  const isAdmin = user?.role?.is_admin;

  const filterRoutes = (routeList: any[]) => {
    return routeList.filter((route) => {
      if (isAdmin) return true;
      if (route.children) {
        route.children = filterRoutes(route.children);
        return route.children.length > 0;
      }
      if (!route.permission) return true;
      return userPermissions.includes(route.permission);
    });
  };

  const filteredRoutes = filterRoutes(routes);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-neutral text-white px-6 py-6 shadow-lg">
      <div className="mx-2 text-center">
        <h1 className="text-6xl uppercase font-bold">HINT</h1>
      </div>
      {/* Navegación */}
      <nav className="mt-2">
        <Box w={200}>
          {filteredRoutes.map((route) => (
            <div key={route.name}>
              {route.children ? (
                <>
                  <div
                    className="cursor-pointer mt-4 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                    onClick={() => toggleSubmenu(route.name)}
                  >
                    {route.name}
                  </div>
                  {openSubmenus[route.name] && (
                    <div className="ml-4">
                      {route.children.map((child: any, index: number) => (
                        <Link key={child.path} href={child.path} passHref>
                          <div
                            className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                              pathname === child.path
                                ? "bg-info text-white"
                                : "text-gray-300 hover:bg-primary hover:text-white"
                            }`}
                            onClick={() => setActive(index)}
                          >
                            {child.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link key={route.path} href={route.path} passHref>
                  <div
                    className={`cursor-pointer mt-4 px-4 py-2 rounded transition-all duration-300 ${
                      pathname === route.path
                        ? "bg-info text-white"
                        : "text-gray-300 hover:bg-primary hover:text-white"
                    }`}
                    onClick={() => setActive(route.name)}
                  >
                    {route.name}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </Box>
      </nav>
    </aside>
  );
};

export default Sidebar;
