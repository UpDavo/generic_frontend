"use client";

import Instructions from "../../tada/components/Instructions";

export default function DashboardHome() {
  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-2 mt-4 text-center">
        Panel de control
      </h1>
      <div className="w-full mb-8">
        <Instructions />
      </div>
      {/* <div className="grid grid-cols-3 gap-4 w-full">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-48 hover:scale-105 transition-transform">
          <span className="text-2xl mb-2">📊</span>
          <span className="font-semibold text-gray-800">Reportes</span>
          <span className="text-xs text-gray-500 text-center">
            Visualiza estadísticas y actividad reciente
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-48 hover:scale-105 transition-transform">
          <span className="text-2xl mb-2">🔔</span>
          <span className="font-semibold text-gray-800">Notificaciones</span>
          <span className="text-xs text-gray-500 text-center">
            Gestiona tus notificaciones y alertas
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-48 hover:scale-105 transition-transform">
          <span className="text-2xl mb-2">⚙️</span>
          <span className="font-semibold text-gray-800">Configuración</span>
          <span className="text-xs text-gray-500 text-center">
            Personaliza tu experiencia
          </span>
        </div>
      </div> */}
    </div>
  );
}
