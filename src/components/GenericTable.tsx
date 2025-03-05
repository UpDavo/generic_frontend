"use client";

import { Button, Loader } from "@mantine/core";
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";

interface GenericTableProps {
  columns?: any;
  data?: any;
  loading?: any;
  onEdit?: any;
  onDelete?: any;
}

const GenericTable = ({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
}: GenericTableProps) => (
  <div className="overflow-x-auto rounded-md">
    <table className="table w-full hidden md:table">
      <thead className="bg-info text-white text-md uppercase font-bold">
        <tr className="text-white">
          {columns.map((col: any) => (
            <th key={col.key}>{col.title}</th>
          ))}
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {loading ? (
          <tr>
            <td colSpan={columns.length + 1} className="text-center py-4">
              <Loader size="sm" color="blue" />
              <p className="mt-2 text-gray-500">Cargando...</p>
            </td>
          </tr>
        ) : data.length > 0 ? (
          data.map((item: any) => (
            <tr key={item.id}>
              {columns.map((col: any) => {
                const value = col.key
                  .split(".")
                  .reduce((acc: any, part: any) => acc && acc[part], item);

                if (Array.isArray(value)) {
                  return (
                    <td key={col.key}>
                      {value.map((val) => val.name || val.path).join(", ")}
                    </td>
                  );
                }

                if (typeof value === "boolean") {
                  return <td key={col.key}>{value ? "Sí" : "No"}</td>;
                }

                return <td key={col.key}>{value || "—"}</td>;
              })}

              <td className="flex gap-2">
                <Button
                  onClick={() => onEdit(item)}
                  className="btn btn-info btn-sm"
                >
                  <RiEdit2Line />
                </Button>
                <Button
                  onClick={() => onDelete(item.id)}
                  className="btn btn-error btn-sm text-white"
                >
                  <RiDeleteBin6Line />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + 1} className="text-center py-4">
              No se encontraron datos.
            </td>
          </tr>
        )}
      </tbody>
    </table>

    {/* Mobile View */}
    <div className="md:hidden space-y-4">
      {loading ? (
        <div className="flex flex-col items-center py-4">
          <Loader size="sm" color="blue" />
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : data.length > 0 ? (
        data.map((item: any) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 bg-white shadow-md"
          >
            {columns.map((col: any) => {
              const value = col.key
                .split(".")
                .reduce((acc: any, part: any) => acc && acc[part], item);

              let displayValue = "—";
              if (Array.isArray(value)) {
                displayValue = value
                  .map((val) => val.name || val.path)
                  .join(", ");
              } else if (typeof value === "boolean") {
                displayValue = value ? "Sí" : "No";
              } else if (value) {
                displayValue = value;
              }

              return (
                <div key={col.key} className="mb-2">
                  <span className="font-semibold">{col.title}: </span>
                  <span>{displayValue}</span>
                </div>
              );
            })}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                onClick={() => onEdit(item)}
                className="btn btn-info btn-sm w-full"
              >
                <RiEdit2Line className="mr-1" /> Editar
              </Button>
              <Button
                onClick={() => onDelete(item.id)}
                className="btn btn-error btn-sm text-white w-full"
              >
                <RiDeleteBin6Line className="mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4">No se encontraron datos.</div>
      )}
    </div>
  </div>
);

export default GenericTable;
