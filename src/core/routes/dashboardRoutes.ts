import { permission } from "process";
import {
  RiDashboardLine,
  RiUser3Line,
  RiTeamLine,
  RiKey2Line,
  RiSettingsLine,
  RiNotification2Line,
  RiPlayListAddFill,
  RiFileListLine,
  RiApps2AddLine,
  RiGridLine,
  RiSendPlaneLine,
  RiFileList2Line,
  RiSmartphoneLine,
  RiMoneyDollarCircleLine,
  RiPriceTag3Line,
  RiNotification3Line,
  RiDatabase2Line,
  RiBarChart2Line,
  RiMedalLine,
  RiWebhookLine,
  RiShoppingCartLine,
  RiStore2Line,
  RiBoxingLine,
  RiFileExcel2Line,
  RiLineChartLine,
} from "react-icons/ri";
export const dashboardRoutes = [
  {
    section: "Menu",
    children: [
      { path: "/dashboard", name: "Inicio", icon: RiDashboardLine },
      {
        path: "/dashboard/payments",
        name: "Pagos",
        icon: RiMoneyDollarCircleLine,
        permission: "/dashboard/payments",
      },
    ],
  },
  {
    section: "Alertas",
    children: [
      {
        path: "/dashboard/webhooks",
        name: "Webhooks",
        icon: RiWebhookLine,
        permission: "/dashboard/webhooks",
      },
    ],
  },
  {
    section: "Comunicación",
    children: [
      {
        name: "Push",
        icon: RiSmartphoneLine,
        children: [
          {
            path: "/dashboard/push/send",
            icon: RiNotification2Line,
            name: "Enviar Push",
            permission: "/push/send",
          },
          {
            path: "/dashboard/push",
            name: "Crear Push",
            icon: RiPlayListAddFill,
            permission: "/push",
          },
          {
            path: "/dashboard/push/logs",
            name: "Registros Push",
            icon: RiFileListLine,
            permission: "/push/logs",
          },
        ],
      },
      {
        name: "In-Apps",
        icon: RiGridLine,
        children: [
          {
            path: "/dashboard/inapps/send",
            icon: RiSendPlaneLine,
            name: "Enviar In-App",
            permission: "/dashboard/inapps/send",
          },
          {
            path: "/dashboard/inapps",
            name: "Crear In-App",
            icon: RiApps2AddLine,
            permission: "/dashboard/inapps",
          },
          {
            path: "/dashboard/inapps/logs",
            name: "Registros In-App",
            icon: RiFileList2Line,
            permission: "/dashboard/inapps/logs",
          },
        ],
      },
    ],
  },
  {
    section: "Reportes",
    children: [
      {
        name: "Reporte de Tráfico",
        icon: RiDatabase2Line,
        children: [
          {
            path: "/dashboard/reports/traffic",
            icon: RiBarChart2Line,
            name: "Ver reporte",
            permission: "/dashboard/reports/traffic",
          },
          {
            path: "/dashboard/reports/goal",
            icon: RiMedalLine,
            name: "Meta diaria",
            permission: "/dashboard/reports/goal",
          },
        ],
      },
      {
        name: "Analiticas Ventas",
        icon: RiBarChart2Line,
        children: [
          {
            path: "/dashboard/sales/process",
            icon: RiFileExcel2Line,
            name: "Procesamiento",
            permission: "/dashboard/sales/process",
          },
          {
            path: "/dashboard/sales/data-historica",
            icon: RiDatabase2Line,
            name: "Data Histórica",
            permission: "/dashboard/sales/data-historica",
          },
          {
            path: "/dashboard/sales/data-historica/hectolitros",
            icon: RiBarChart2Line,
            name: "Hectolitros",
            permission: "/dashboard/sales/data-historica/hectolitros",
          },
          {
            path: "/dashboard/sales/data-historica/comparacion-anual",
            icon: RiLineChartLine,
            name: "Comparación Anual",
            permission: "/dashboard/sales/data-historica/comparacion-anual",
          },
          {
            path: "/dashboard/sales/data-historica/top-skus",
            icon: RiBarChart2Line,
            name: "Top SKUs por Región",
            permission: "/dashboard/sales/data-historica/top-skus",
          },
        ],
      },
      {
        name: "Conf. reporte ventas",
        icon: RiSettingsLine,
        children: [
          {
            path: "/dashboard/sales/hectolitros-meta",
            icon: RiMedalLine,
            name: "Conf. Hectolitros",
            permission: "/dashboard/sales/hectolitros-meta",
          },
          {
            path: "/dashboard/sales/pocs",
            icon: RiStore2Line,
            name: "Conf. Pocs",
            permission: "/dashboard/sales/pocs",
          },
          {
            path: "/dashboard/sales/productos-compra",
            icon: RiBoxingLine,
            name: "Conf. Sku Compra",
            permission: "/dashboard/sales/productos-compra",
          },
          {
            path: "/dashboard/sales/productos-app",
            icon: RiBoxingLine,
            name: "Conf. Sku App",
            permission: "/dashboard/sales/productos-app",
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
            path: "/dashboard/notifications",
            name: "Notificaciones",
            permission: "/dashboard/notifications",
            icon: RiNotification3Line,
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
          {
            path: "/dashboard/pricing",
            name: "Precios",
            permission: "/dashboard/pricing",
            icon: RiPriceTag3Line,
          },
        ],
      },
    ],
  },
];
