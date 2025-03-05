"use client";
import { useState } from "react";
import { Box, Drawer } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileDrawerProps } from "@/interfaces/navigation";

const MobileDrawer: React.FC<MobileDrawerProps & { user: any }> = ({
  routes,
  drawerOpened,
  setDrawerOpened,
  user,
}) => {
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );
  const pathname = usePathname(); // ← Importamos la ruta actual

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
          {filteredRoutes.map((route) => {
            const hasChildren = Boolean(route.children);

            return (
              <div key={route.name}>
                {hasChildren ? (
                  <>
                    {/* CABECERA DE SUBMENÚ */}
                    <div
                      className="cursor-pointer mt-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                      onClick={() => toggleSubmenu(route.name)}
                    >
                      {route.name}
                    </div>

                    {openSubmenus[route.name] && (
                      <div className="ml-4">
                        {route.children.map((child: any) => {
                          // Verificamos si ESTE child está activo
                          const isActive = pathname === child.path;

                          return (
                            <Link key={child.path} href={child.path} passHref>
                              <div
                                className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                                  isActive
                                    ? "bg-info text-base-100"
                                    : "text-gray-300 hover:bg-primary hover:text-white"
                                }`}
                                onClick={() => setDrawerOpened(false)}
                              >
                                {child.name}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // RUTA SIN CHILDREN
                  <Link key={route.path} href={route.path} passHref>
                    {/* Detectamos si el path es la ruta activa */}
                    <div
                      className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                        pathname === route.path
                          ? "bg-info text-base-100"
                          : "text-gray-300 hover:bg-primary hover:text-white"
                      }`}
                      onClick={() => setDrawerOpened(false)}
                    >
                      {route.name}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </Box>
      </nav>
    </Drawer>
  );
};

export default MobileDrawer;
