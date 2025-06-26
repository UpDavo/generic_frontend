// export const dashboardRoutes = [
//   { path: "/dashboard", name: "Inicio" },

//   //Push
//   {
//     path: "/dashboard/push/send",
//     name: "Enviar Push",
//     permission: "/push/send",
//   },
//   { path: "/dashboard/push", name: "Crear Mensajes", permission: "/push" },
//   {
//     path: "/dashboard/push/logs",
//     name: "Obtener Logs",
//     permission: "/push/logs",
//   },
//   // { path: "/dashboard/pocs", name: "Reporte de Pocs" },

//   //User
//   { path: "/dashboard/user", name: "Usuarios", permission: "/users/" },
//   // { path: "/dashboard/user/roles", name: "Roles" },
//   // { path: "/dashboard/user/permission", name: "Permisos" },
// ];

export const dashboardRoutes = [
  {
    section: "Menu",
    children: [
      { path: "/dashboard", name: "Inicio" },
      {
        name: "Push",
        children: [
          {
            path: "/dashboard/push/send",
            name: "Enviar Push",
            permission: "/push/send",
          },
          {
            path: "/dashboard/push",
            name: "Crear Mensajes",
            permission: "/push",
          },
          {
            path: "/dashboard/push/logs",
            name: "Obtener Logs",
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
        children: [
          { path: "/dashboard/user", name: "Usuarios", permission: "/users" },
        ],
      },
    ],
  },
];
