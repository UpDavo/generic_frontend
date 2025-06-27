import {
  RiDashboardLine,
  RiUser3Line,
  RiTeamLine,
  RiKey2Line,
  RiSettingsLine,
  RiMailSendLine,
  RiMailAddLine,
  RiFileListLine,
  RiMessage2Line,
} from "react-icons/ri";
export const dashboardRoutes = [
  {
    section: "Menu",
    children: [
      { path: "/dashboard", name: "Inicio", icon: RiDashboardLine },
      {
        name: "Push",
        icon: RiMessage2Line,
        children: [
          {
            path: "/dashboard/push/send",
            icon: RiMailSendLine,
            name: "Enviar Push",
            permission: "/push/send",
          },
          {
            path: "/dashboard/push",
            name: "Crear Mensajes",
            icon: RiMailAddLine,
            permission: "/push",
          },
          {
            path: "/dashboard/push/logs",
            name: "Obtener Logs",
            icon: RiFileListLine,
            permission: "/push/logs",
          },
        ],
      },
    ],
  },
  {
    section: "Ajustes",
    children: [
      {
        name: "Configuracion",
        icon: RiSettingsLine,
        children: [
          {
            path: "/dashboard/user",
            name: "Usuarios",
            permission: "/users",
            icon: RiUser3Line,
          },
          {
            path: "/dashboard/user/roles",
            name: "Roles",
            permission: "/dashboard/user/roles",
            icon: RiTeamLine,
          },
          {
            path: "/dashboard/user/permission",
            name: "Permisos",
            permission: "/dashboard/user/permission",
            icon: RiKey2Line,
          },
        ],
      },
    ],
  },
];
