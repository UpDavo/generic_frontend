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
  const pathname = usePathname();

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Filtrar rutas según permisos del usuario o si es admin
  const userPermissions =
    user?.role?.permissions?.map((perm: any) => perm.path) || [];
  const isAdmin = user?.role?.is_admin;

  const filterRoutes = (routeList: any[]) => {
    return routeList
      .map((section) => ({
        ...section,
        children: section.children.filter((route: any) => {
          if (isAdmin) return true;
          if (route.children) {
            route.children = route.children.filter((child: any) => {
              return (
                !child.permission || userPermissions.includes(child.permission)
              );
            });
            return route.children.length > 0;
          }
          return (
            !route.permission || userPermissions.includes(route.permission)
          );
        }),
      }))
      .filter((section) => section.children.length > 0);
  };

  const filteredRoutes = filterRoutes(routes);

  return (
    <Drawer
      opened={drawerOpened}
      onClose={() => setDrawerOpened(false)}
      padding="xl"
      className="p-0"
      styles={{
        body: { padding: 0 },
      }}
      title="HINT"
    >
      <div className="w-full h-full bg-primary text-white">
        <nav className="px-4 py-4">
          {/* Logo y título */}
          {/* <h1 className="text-white text-5xl font-bold mb-5 text-center">
            HINT
          </h1> */}

          {filteredRoutes.map((section) => (
            <div key={section.section} className="mb-4">
              {/* Divider (título de sección) */}
              <div className="divider divider-accent text-white text-md">
                {section.section}
              </div>

              {section.children.map((route: any) => {
                const hasChildren = Boolean(route.children);

                return (
                  <div key={route.name}>
                    {hasChildren ? (
                      <>
                        {/* Título del submenú */}
                        <div
                          className="cursor-pointer mt-2 px-4 py-2 rounded bg-slate-200 bg-opacity-35 text-white"
                          onClick={() => toggleSubmenu(route.name)}
                        >
                          {route.name}
                        </div>

                        {/* Links dentro del submenú */}
                        {openSubmenus[route.name] && (
                          <div className="ml-4">
                            {route.children.map((child: any) => {
                              const isActive = pathname === child.path;

                              return (
                                <Link
                                  key={child.path}
                                  href={child.path}
                                  passHref
                                >
                                  <div
                                    className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                                      isActive
                                        ? "bg-base-100 text-primary"
                                        : "hover:bg-base-100 hover:text-primary"
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
                      // Link directo sin hijos
                      <Link key={route.path} href={route.path} passHref>
                        <div
                          className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                            pathname === route.path
                              ? "bg-base-100 text-primary"
                              : "hover:bg-base-100 hover:text-primary"
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
            </div>
          ))}
        </nav>
      </div>
    </Drawer>
  );
};

export default MobileDrawer;
