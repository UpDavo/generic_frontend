/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/hooks/useAuth";

import { RiMenuLine, RiSettings3Line } from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import withAuth from "@/hoc/withAuth";
import Sidebar from "@/components/Sidebar";
import MobileDrawer from "@/components/MobileDrawer";
import { RootChildren } from "@/interfaces/root";
import { dashboardRoutes } from "@/routes/dashboardRoutes";
import Link from "next/link";
import { Button } from "@mantine/core";

function DashboardLayout({ children }: RootChildren) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [activeRoute, setActiveRoute] = useState("");
  const pathname = usePathname();

  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const currentRoute = dashboardRoutes.find(
      (route) => route.path === pathname
    );
    if (currentRoute) {
      setActiveRoute(currentRoute.name);
      // console.log("Ruta activa:", currentRoute);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar y Drawer móvil */}
      <Sidebar routes={dashboardRoutes} />
      <MobileDrawer
        routes={dashboardRoutes}
        drawerOpened={drawerOpened}
        setDrawerOpened={setDrawerOpened}
      />

      {/* Contenedor principal a la derecha del Sidebar */}
      <div className="flex flex-col w-full">
        {/* Header fijo (puedes unificar la lógica para móvil y desktop) */}
        <header className="bg-gray-700 text-white flex items-center justify-between px-5 py-4">
          {/* Botón hamburguesa visible solo en móvil */}
          <button
            onClick={() => setDrawerOpened(true)}
            className="mr-4 md:hidden"
          >
            <RiMenuLine className="text-xl" />
          </button>

          {/* Título o breadcrumb */}
          <h2 className="text-xl font-bold">{activeRoute}</h2>

          {/* Información de usuario (puedes moverla a tu “sub-header” si prefieres) */}
          {user && (
            <div className="flex flex-row items-center gap-2">
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
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold uppercase text-primary">
                {user.first_name?.charAt(0)}
              </div>
            </div>
          )}
        </header>

        {/* Contenedor scrollable que envuelve el contenido central */}
        <main className="flex-1 overflow-auto p-6 bg-base-200">{children}</main>

        {/* Footer fijo en la parte inferior */}
        <footer className="bg-gray-700 text-white p-4 flex items-center justify-center">
          <p>© 2025 - Heimdal</p>
        </footer>
      </div>
    </div>
  );
}

export default withAuth(DashboardLayout);
