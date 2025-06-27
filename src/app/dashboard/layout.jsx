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
    <div className="flex h-screen bg-white overflow-x-hidden">
      {/* Sidebar Desktop */}
      <Sidebar user={user} handleLogout={handleLogout} />

      {/* Mobile Drawer */}
      <Drawer
        routes={dashboardRoutes}
        drawerOpened={drawerOpened}
        setDrawerOpened={setDrawerOpened}
        user={user}
      />

      {/* Contenedor principal ajustable */}
      <div
        className={`flex flex-col flex-1 h-full transition-all duration-300 ${
          sidebarVisible ? "ml-0" : "-ml-96"
        }`}
      >
        <header className="md:hidden w-full flex-none">
          <div className="flex items-center justify-between ml-5 mt-6 mb-1 w-full">
            <button
              onClick={() => setDrawerOpened(true)}
              className="mr-4 md:hidden"
            >
              <div className="flex items-center space-x-2">
                <RiMenuLine className="text-xl" />
                <span className="text-primary">Menú</span>
              </div>
            </button>
          </div>
        </header>

        {/* Contenido central */}
        <main className="flex-1 p-4 bg-white overflow-y-auto">
          <div className="h-full p-8 overflow-hidden bg-gray-100 rounded-xl shadow-lg border border-gray-200">
            <div className="overflow-y-auto h-full">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default withAuth(DashboardLayout);
