"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  RiDashboardLine,
  RiSettingsLine,
  RiMenuLine,
  RiCloseLine,
} from "react-icons/ri";
import { useState, useMemo, useEffect } from "react";
import { dashboardRoutes } from "@/core/routes/dashboardRoutes";
import Image from "next/image";

export default function Sidebar2({ className = "", user, handleLogout }) {
  const pathname = usePathname();
  const [isShortScreen, setIsShortScreen] = useState(false);

  const userPermissions =
    user?.role?.permissions?.map((perm) => perm.path) || [];
  // console.log("User Permissions:", userPermissions);
  const isAdmin = user?.role?.is_admin;
  // console.log("Is Admin:", isAdmin);

  const filterRoutes = (routeList) => {
    return routeList
      .map((section) => ({
        ...section,
        children: section.children
          .map((route) => {
            if (route.children) {
              const filteredChildren = route.children.filter(
                (child) =>
                  isAdmin ||
                  !child.permission ||
                  userPermissions.includes(child.permission)
              );
              return filteredChildren.length > 0
                ? { ...route, children: filteredChildren }
                : null;
            } else {
              return isAdmin ||
                !route.permission ||
                userPermissions.includes(route.permission)
                ? route
                : null;
            }
          })
          .filter(Boolean),
      }))
      .filter((section) => section.children.length > 0);
  };

  useEffect(() => {
    const update = () => setIsShortScreen(window.innerHeight < 700);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const filteredRoutes = useMemo(
    () => filterRoutes(dashboardRoutes),
    [dashboardRoutes, userPermissions, isAdmin, user]
  );

  const [openSubmenus, setOpenSubmenus] = useState(() => {
    const initialOpenSubmenus = {};
    filteredRoutes.forEach((section) => {
      section.children.forEach((route) => {
        if (route.children) {
          const isChildActive = route.children.some((child) =>
            pathname.startsWith(child.path)
          );
          if (isChildActive) {
            initialOpenSubmenus[route.name] = true;
          }
        }
      });
    });
    return initialOpenSubmenus;
  });

  const toggleSubmenu = (menu) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      id="sidebar"
      className={`transition-all duration-200 relative bg-white rounded-xl ml-4 mt-4 mb-4 shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-2rem)] overflow-hidden flex-shrink-0
          ${collapsed ? "w-20" : "w-80"} hidden md:block ${className}`}
    >
      {/* Header fijo - Toggle button */}
      <div className="flex-none p-4">
        <div className="mt-4 flex flex-col items-center">
          {/* Swap hamburger/close button DaisyUI con Remix Icons */}
          <label className="swap swap-rotate">
            <input
              type="checkbox"
              checked={collapsed}
              onChange={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
              className="hidden"
            />
            {/* hamburger icon */}
            <span className="swap-off">
              <RiCloseLine className="text-3xl text-primary" />
            </span>
            {/* close icon */}
            <span className="swap-on">
              <RiMenuLine className="text-3xl text-primary" />
            </span>
          </label>
        </div>

        {/* Logo */}
        <div className="mt-8 flex flex-col items-center">
          <h1
            className={`uppercase font-bold text-primary transition-all ${collapsed ? "text-2xl" : "text-6xl"
              }`}
          >
            HINT
          </h1>
        </div>
      </div>

      {/* Menú con scroll */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        <div className="py-4">
          <ul className="menu w-full menu-lg menu-vertical p-0 text-primary text-lg [&_li>*]:rounded-md [&_details>*]:rounded-md">
            {filteredRoutes.map((section) => (
              <div key={section.section}>
                {!collapsed && (
                  <div className="divider divider-gray-200 text-md">
                    {section.section}
                  </div>
                )}
                {section.children.map((route) => {
                  const isSubrouteActive =
                    route.children &&
                    route.children.some((child) => pathname === child.path);
                  const isActive = pathname === route.path || isSubrouteActive;
                  return (
                    <li className="mt-1" key={route.name}>
                      {route.children ? (
                        <details open={openSubmenus[route.name]}>
                          <summary
                            className={isActive ? "menu-active" : ""}
                            onClick={() => toggleSubmenu(route.name)}
                          >
                            {route.icon ? <route.icon /> : <RiSettingsLine />}
                            {!collapsed && (
                              <span className="ms-3">{route.name}</span>
                            )}
                          </summary>
                          <ul>
                            {route.children.map((child) => (
                              <li className="mt-1" key={child.path}>
                                <Link
                                  href={child.path}
                                  className={`${pathname === child.path ? "menu-active" : ""
                                    }`}
                                >
                                  {child.icon ? (
                                    <child.icon />
                                  ) : (
                                    <RiDashboardLine />
                                  )}
                                  {!collapsed && (
                                    <span className="ms-3">{child.name}</span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <Link
                          href={route.path}
                          className={` ${isActive ? "menu-active" : ""}`}
                        >
                          {route.icon ? <route.icon /> : <RiDashboardLine />}
                          {!collapsed && (
                            <span className="ms-3">{route.name}</span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </div>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer fijo - Perfil y logout */}
      <div className="flex-none p-4 border-t border-gray-200">
        <div className="text-white transition-all duration-300">
          <Link
            href="/dashboard/profile"
            className={`btn btn-ghost flex flex-row items-center gap-4 px-4 py-10 w-full ${collapsed
              ? "justify-center px-2 py-4 min-w-[60px] max-w-[60px]"
              : "min-w-[220px]"
              }`}
          >
            <div className="avatar avatar-online avatar-placeholder">
              <div className="w-12 rounded-full bg-neutral">
                {user?.photoUrl ? (
                  <Image
                    src={user.photoUrl}
                    alt="avatar"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user?.first_name?.charAt(0) || (
                      <span className="icon-[mdi--account]" />
                    )}
                  </span>
                )}
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold text-primary line-clamp-1">
                  {user?.first_name || "Usuario"}
                </span>
                <span className="text-xs text-gray-500 font-medium mt-1">
                  Ver perfil
                </span>
              </div>
            )}
          </Link>
          {/* Botón de logout debajo de Ver perfil */}
          <button
            onClick={handleLogout}
            className={`btn btn-outline btn-primary w-full mt-1 ${collapsed ? "px-2 py-2 min-w-[60px] max-w-[60px]" : " "
              }`}
          >
            <span className="text-base font-semibold">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
