"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  RiDashboardLine,
  RiSettingsLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxLine,
  RiUserLine,
} from "react-icons/ri";
import { useState, useMemo } from "react";
import { dashboardRoutes } from "@/core/routes/dashboardRoutes";
import Image from "next/image";

export default function Sidebar2({ className = "", user, handleLogout }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userPermissions =
    user?.role?.permissions?.map((perm) => perm.path) || [];
  const isAdmin = user?.role?.is_admin;

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

  return (
    <aside
      className={`hidden md:flex flex-col bg-gradient-to-b from-white to-gray-50 shadow-2xl border-r border-gray-200 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-72"
      } ${className}`}
      style={{ height: "100vh" }}
    >
      {/* Header - Logo y Toggle */}
      <div className="flex-shrink-0 px-4 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-4xl font-black text-primary tracking-tight">
              HINT
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? (
              <RiMenuLine className="text-2xl text-primary" />
            ) : (
              <RiCloseLine className="text-2xl text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Menú de navegación con scroll */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" style={{ minHeight: 0 }}>
        <div className="space-y-1">
          {filteredRoutes.map((section, sectionIdx) => (
            <div key={section.section} className={sectionIdx > 0 ? "mt-6" : ""}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.section}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.children.map((route) => {
                  const isSubrouteActive =
                    route.children &&
                    route.children.some((child) => pathname === child.path);
                  const isActive = pathname === route.path || isSubrouteActive;

                  return (
                    <div key={route.name}>
                      {route.children ? (
                        <div>
                          <button
                            onClick={() => toggleSubmenu(route.name)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                              isActive
                                ? "bg-primary text-white shadow-md"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {route.icon ? (
                                <route.icon className="text-xl flex-shrink-0" />
                              ) : (
                                <RiSettingsLine className="text-xl flex-shrink-0" />
                              )}
                              {!collapsed && (
                                <span className="font-medium text-sm">
                                  {route.name}
                                </span>
                              )}
                            </div>
                            {!collapsed && (
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  openSubmenus[route.name] ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            )}
                          </button>
                          
                          {openSubmenus[route.name] && !collapsed && (
                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                              {route.children.map((child) => (
                                <Link
                                  key={child.path}
                                  href={child.path}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                    pathname === child.path
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                  }`}
                                >
                                  {child.icon ? (
                                    <child.icon className="text-lg flex-shrink-0" />
                                  ) : (
                                    <RiDashboardLine className="text-lg flex-shrink-0" />
                                  )}
                                  <span>{child.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={route.path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                            isActive
                              ? "bg-primary text-white shadow-md"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {route.icon ? (
                            <route.icon className="text-xl flex-shrink-0" />
                          ) : (
                            <RiDashboardLine className="text-xl flex-shrink-0" />
                          )}
                          {!collapsed && (
                            <span className="font-medium text-sm">
                              {route.name}
                            </span>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - Usuario y Logout */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <div className="p-3 space-y-2">
          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="relative flex-shrink-0">
              {user?.photoUrl ? (
                <Image
                  src={user.photoUrl}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <span className="text-primary font-bold text-lg">
                    {user?.first_name?.charAt(0) || <RiUserLine />}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.first_name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500">Ver perfil</p>
              </div>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <RiLogoutBoxLine className="text-xl flex-shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
