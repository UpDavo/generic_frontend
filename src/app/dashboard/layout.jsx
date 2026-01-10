/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/core/hooks/useAppDispatch";
import { logoutUser } from "@/auth/hooks/useAuth";

import { RiMenuLine } from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import withAuth from "@/core/hoc/withAuth";
import Drawer from "@/core/components/Drawer";
import { dashboardRoutes } from "@/core/routes/dashboardRoutes";
import Sidebar from "@/core/components/Sidebar";

function DashboardLayout({ children }) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Controla visibilidad de Sidebar2
  const [activeRoute, setActiveRoute] = useState("");
  const pathname = usePathname();

  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  function findCurrentRoute(routes, pathname) {
    for (const route of routes) {
      if (route.path === pathname) {
        return route;
      }
      if (route.children) {
        const childMatch = findCurrentRoute(route.children, pathname);
        if (childMatch) {
          return childMatch;
        }
      }
    }
    return null;
  }

  useEffect(() => {
    const currentRoute = findCurrentRoute(dashboardRoutes, pathname);
    if (currentRoute) {
      setActiveRoute(currentRoute.name);
    } else {
      setActiveRoute("");
    }
  }, [pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <Sidebar user={user} handleLogout={handleLogout} />

      {/* Mobile Drawer */}
      <Drawer
        routes={dashboardRoutes}
        drawerOpened={drawerOpened}
        setDrawerOpened={setDrawerOpened}
        user={user}
      />

      {/* Contenedor principal */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="md:hidden w-full flex-none bg-white border-b border-gray-200">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setDrawerOpened(true)}
              className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
            >
              <RiMenuLine className="text-2xl" />
              <span className="font-medium">Menú</span>
            </button>
          </div>
        </header>

        {/* Contenido central */}
        <main className="flex-1 overflow-hidden p-4 md:p-6">
          <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default withAuth(DashboardLayout);
