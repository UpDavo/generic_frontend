"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box } from "@mantine/core";
import { SidebarProps } from "@/interfaces/navigation";

const Sidebar: React.FC<SidebarProps> = ({ routes }) => {
  const pathname = usePathname();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const currentIndex = routes.findIndex((route) => route.path === pathname);
    if (currentIndex !== -1) {
      setActive(currentIndex);
    }
  }, [pathname, routes]);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-neutral text-white px-6 py-6 shadow-lg">
      <div className="mx-2">
        <h1 className="text-3xl uppercase font-bold">HINT</h1>
      </div>
      {/* Navegación */}
      <nav className="mt-2">
        <Box w={200}>
          {routes.map((route, index) => (
            <Link key={route.path} href={route.path} passHref>
              <div
                className={`cursor-pointer mt-2 px-4 py-2 rounded transition-all duration-300 ${
                  index === active
                    ? "bg-info text-white"
                    : "text-gray-300 hover:bg-primary hover:text-white"
                }`}
                onClick={() => setActive(index)}
              >
                {route.name}
              </div>
            </Link>
          ))}
        </Box>
      </nav>
    </aside>
  );
};

export default Sidebar;
