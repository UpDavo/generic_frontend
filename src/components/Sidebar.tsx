"use client";
import Link from "next/link";
import { Button } from "@mantine/core";
import { SidebarProps } from "@/interfaces/navigation";

const Sidebar: React.FC<SidebarProps> = ({ routes, handleLogout }) => (
  <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white p-6">
    <h2 className="text-xl font-bold">Dashboard</h2>
    <nav className="mt-6">
      <ul>
        {routes.map((route) => (
          <li key={route.path}>
            <Link href={route.path} className="block py-2">
              {route.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    <Button
      onClick={handleLogout}
      className="mt-auto bg-red-500 hover:bg-red-600"
    >
      Logout
    </Button>
  </aside>
);

export default Sidebar;
