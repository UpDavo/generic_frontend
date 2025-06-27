"use client";
import { useState } from "react";
import { Box, Drawer } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileDrawer = ({ routes, drawerOpened, setDrawerOpened, user }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const pathname = usePathname();

  const toggleSubmenu = (menu) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Filtrar rutas según permisos del usuario o si es admin
  const userPermissions =
    user?.role?.permissions?.map((perm) => perm.path) || [];
  const isAdmin = user?.role?.is_admin;

  const filterRoutes = (routeList) => {
    return routeList
      .map((section) => ({
        ...section,
        children: section.children.filter((route) => {
          if (isAdmin) return true;
          if (route.children) {
            route.children = route.children.filter((child) => {
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
      <div className="w-full bg-white text-primary overflow-auto">
        <nav className="px-4 py-4">
          {filteredRoutes.map((section) => (
            <div key={section.section} className="mb-4">
              {/* Divider (título de sección) */}
              <div className="divider divider-primary/90 text-primary text-md">
                {section.section}
              </div>

              {section.children.map((route) => {
                const hasChildren = Boolean(route.children);
                // Detectar si alguna subruta está activa
                const isParentActive =
                  hasChildren &&
                  route.children.some((child) => pathname === child.path);

                return (
                  <div key={route.name}>
                    {hasChildren ? (
                      <>
                        {/* Título del submenú */}
                        <div
                          className={`flex items-center gap-2 cursor-pointer mt-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isParentActive
                              ? "bg-[#18181b] text-white"
                              : "bg-slate-200 bg-opacity-35 text-primary"
                          }`}
                          onClick={() => toggleSubmenu(route.name)}
                        >
                          {route.icon && (
                            <span className="text-xl flex-shrink-0">
                              {<route.icon />}
                            </span>
                          )}
                          <span>{route.name}</span>
                        </div>

                        {/* Links dentro del submenú */}
                        {openSubmenus[route.name] && (
                          <div className="ml-4">
                            {route.children.map((child) => {
                              const isActive = pathname === child.path;

                              return (
                                <Link
                                  key={child.path}
                                  href={child.path}
                                  passHref
                                >
                                  <div
                                    className={`flex items-center gap-2 cursor-pointer mt-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                      isActive
                                        ? "bg-[#18181b] text-white"
                                        : "hover:bg-base-100 hover:text-primary"
                                    }`}
                                    onClick={() => setDrawerOpened(false)}
                                  >
                                    {child.icon && (
                                      <span className="text-xl flex-shrink-0">
                                        {<child.icon />}
                                      </span>
                                    )}
                                    <span>{child.name}</span>
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
                          className={`flex items-center gap-2 cursor-pointer mt-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                            pathname === route.path
                              ? "bg-[#18181b] text-white"
                              : "hover:bg-base-100 hover:text-primary"
                          }`}
                          onClick={() => setDrawerOpened(false)}
                        >
                          {route.icon && (
                            <span className="text-xl flex-shrink-0">
                              {<route.icon />}
                            </span>
                          )}
                          <span>{route.name}</span>
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
