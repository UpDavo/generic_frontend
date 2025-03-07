import React from "react";

export const Unauthorized = () => {
  return (
    <div className="flex flex-col justify-center items-center mt-64">
      <h1 className="text-3xl font-bold text-red-500">Acceso Denegado</h1>
      <p className="mt-2 text-gray-600">
        No tienes permisos para ver esta página.
      </p>
    </div>
  );
};
