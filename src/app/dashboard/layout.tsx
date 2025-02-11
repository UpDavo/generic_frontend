/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/hooks/useAuth";

import { RiMenuLine } from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import withAuth from "@/hoc/withAuth";
import Sidebar from "@/components/Sidebar";
import MobileDrawer from "@/components/MobileDrawer";
import { RootChildren } from "@/interfaces/root";
import { dashboardRoutes } from "@/routes/dashboardRoutes";

function DashboardLayout({ children }: RootChildren) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        routes={dashboardRoutes}
        handleLogout={handleLogout}
        user={user}
      />
      <MobileDrawer
        routes={dashboardRoutes}
        drawerOpened={drawerOpened}
        setDrawerOpened={setDrawerOpened}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-neutral text-white flex items-center px-5 py-6 md:hidden">
          <button onClick={() => setDrawerOpened(true)} className="mr-4">
            <RiMenuLine className="text-xl" />
          </button>
          <h2 className="text-xl font-bold">Dashboard</h2>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default withAuth(DashboardLayout);
