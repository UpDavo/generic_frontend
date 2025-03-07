/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/hooks/useAuth";

import { RiMenuLine, RiSettings3Line } from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import withAuth from "@/hoc/withAuth";
import MobileDrawer from "@/components/MobileDrawer";
import { RootChildren } from "@/interfaces/root";
import { dashboardRoutes } from "@/routes/dashboardRoutes";
import Link from "next/link";
import { Button } from "@mantine/core";
import Sidebar2 from "@/components/Sidebar2";

function DashboardLayout({ children }: RootChildren) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Controla visibilidad de Sidebar2
  const [activeRoute, setActiveRoute] = useState("");
  const pathname = usePathname();

  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  function findCurrentRoute(routes: any[], pathname: string): any | null {
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
    <div className="flex h-screen-dvh">
      {/* Sidebar Desktop */}
      <Sidebar2
        className={`fixed left-0 top-0 h-screen transition-transform duration-300 ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        routes={dashboardRoutes}
        drawerOpened={drawerOpened}
        setDrawerOpened={setDrawerOpened}
        user={user}
      />

      {/* Contenedor principal ajustable */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          sidebarVisible ? "ml-0" : "-ml-96"
        } w-full`}
      >
        <header>
          <div className="bg-white text-black flex items-center justify-between px-5 py-4">
            {/* Botón hamburguesa visible solo en móvil */}
            <button
              onClick={() => setDrawerOpened(true)}
              className="mr-4 md:hidden"
            >
              <RiMenuLine className="text-xl" />
            </button>

            {/* Botón para ocultar/mostrar Sidebar2 */}
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="mr-4 hidden md:block"
            >
              <RiMenuLine className="text-xl" />
            </button>

            {/* Información de usuario */}
            {user && (
              <div className="flex flex-row items-center gap-2 ">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn rounded-full btn-ghost">
                    <RiSettings3Line className="text-xl" />
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 text-black rounded-box w-52 mt-3 z-[100] gap-2 shadow-md"
                  >
                    <li>
                      <Link href="/dashboard/profile">Ver Perfil</Link>
                    </li>
                    <li>
                      <Button
                        onClick={handleLogout}
                        className="btn btn-error text-white"
                      >
                        Logout
                      </Button>
                    </li>
                  </ul>
                </div>
                <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold uppercase text-white">
                  {user.first_name?.charAt(0)}
                </div>
              </div>
            )}
          </div>
          <div className="bg-gray-200 text-black flex items-center justify-between px-5 py-4 shadow-xl">
            <h2 className="text-xl font-bold uppercase">{activeRoute}</h2>
          </div>
        </header>

        {/* Contenido central */}
        <main className="flex-1 overflow-auto p-6 bg-white">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-700 text-white p-4 flex items-center justify-center">
          <p>© {new Date().getFullYear()} - HINT by Heimdal</p>
        </footer>
      </div>
    </div>
  );
}

export default withAuth(DashboardLayout);
