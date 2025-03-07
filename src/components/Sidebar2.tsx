"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { RiDashboardLine, RiSettingsLine } from "react-icons/ri"; // Puedes personalizar íconos
import { useState, useEffect } from "react";
import { dashboardRoutes } from "@/routes/dashboardRoutes";
import Image from "next/image";

interface SidebarProps {
  className: any;
}

export default function Sidebar2({ className }: SidebarProps) {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const newOpenSubmenus: { [key: string]: boolean } = {};
    dashboardRoutes.forEach((section) => {
      section.children.forEach((route: any) => {
        if (route.children) {
          const isChildActive = route.children.some((child: any) =>
            pathname.startsWith(child.path)
          );
          newOpenSubmenus[route.name] = isChildActive;
        }
      });
    });
    setOpenSubmenus(newOpenSubmenus);
  }, [pathname]);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <div
      id="sidebar"
      className={
        "relative hidden md:block w-96 h-screen p-4 overflow-y-auto transition-transform bg-primary text-white shadow" +
        className
      }
    >
      {/* Logo */}
      <div className="mt-8 flex justify-center">
        <h1 className="text-6xl uppercase font-bold">HINT</h1>
      </div>

      {/* Menú */}
      <div className="py-4 overflow-y-auto mt-4">
        <ul className="menu menu-lg menu-vertical p-0 text-white text-lg [&_li>*]:rounded-md [&_details>*]:rounded-md">
          {dashboardRoutes.map((section) => (
            <div key={section.section}>
              {/* Divider con nombre de sección */}
              <div className="divider divider-accent text-md">
                {section.section}
              </div>

              {/* Iterar sobre las rutas dentro de esta sección */}
              {section.children.map((route) => (
                <li className="mt-1" key={route.name}>
                  {route.children ? (
                    <details open={openSubmenus[route.name]}>
                      <summary
                        className="hover:bg-base-100 hover:text-primary cursor-pointer active:bg-white active:text-primary"
                        onClick={() => toggleSubmenu(route.name)}
                      >
                        <RiSettingsLine />
                        <span className="ms-3">{route.name}</span>
                      </summary>
                      <ul>
                        {route.children.map((child) => (
                          <li className="mt-1" key={child.path}>
                            <Link
                              href={child.path}
                              className={`hover:bg-base-100 hover:text-primary ${
                                pathname === child.path
                                  ? "bg-base-100 text-primary"
                                  : ""
                              }`}
                            >
                              <span className="ms-3">{child.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <Link
                      href={route.path}
                      className={`hover:bg-base-100 hover:text-primary flex items-center gap-3 ${
                        pathname === route.path
                          ? "bg-base-100 text-primary"
                          : ""
                      }`}
                    >
                      <RiDashboardLine />
                      <span className="ms-3">{route.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
}
