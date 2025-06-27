"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/auth/services/roleApi";
import {
  Loader,
  TextInput,
  Button,
  Notification,
  Pagination,
  Modal,
  MultiSelect,
  Checkbox,
  Select,
} from "@mantine/core";
import {
  RiAddLine,
  RiSearchLine,
  RiEdit2Line,
  RiDeleteBin6Line,
} from "react-icons/ri";
import { dashboardRoutes } from "@/core/routes/dashboardRoutes";
import { useRouter } from "next/navigation";
import { Unauthorized } from "@/core/components/Unauthorized";

const PERMISSION_PATH = "/dashboard/user/permission";

const methodOptions = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
];

export default function PermissionPage() {
  const { accessToken, user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [formState, setFormState] = useState({
    name: "",
    path: "",
    methods: [],
    description: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [authorized, setAuthorized] = useState(null);
  const router = useRouter();

  // Obtener rutas activas del dashboard
  const getActiveRoutes = () => {
    const result = [];
    dashboardRoutes.forEach((section) => {
      section.children.forEach((route) => {
        if (route.children) {
          route.children.forEach((child) => {
            result.push(child.path);
          });
        } else {
          result.push(route.path);
        }
      });
    });
    return result;
  };
  const activeRoutes = getActiveRoutes();

  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === PERMISSION_PATH);

    if (hasPermission) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, router]);

  // Fetch permissions con paginación y búsqueda
  useEffect(() => {
    if (accessToken) {
      const delaySearch = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [accessToken, page, searchQuery]);

  // Actualiza fetchData para soportar paginación y búsqueda en frontend
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listPermissions(accessToken);
      // Filtrado y paginación en frontend
      let filtered = data.results || data;
      if (searchQuery) {
        filtered = filtered.filter((perm) =>
          perm.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setTotalPages(Math.ceil(filtered.length / 10));
      setPermissions(filtered.slice((page - 1) * 10, page * 10));
      setError(null);
    } catch (err) {
      setError("Error al cargar los permisos");
    } finally {
      setLoading(false);
    }
  };

  // Save permission
  const handleSave = async () => {
    if (!formState.name || !formState.path) return;
    try {
      if (editingId) {
        // Convert methods from string[] to number[] if needed
        const updatedFormState = {
          ...formState,
          methods: formState.methods.map((m) => {
            const methodMap = {
              GET: 1,
              POST: 2,
              PUT: 3,
              DELETE: 4,
            };
            return typeof m === "string" ? methodMap[m] ?? m : m;
          }),
        };
        await updatePermission(editingId, updatedFormState, accessToken);
      } else {
        const methodMap = {
          GET: 1,
          POST: 2,
          PUT: 3,
          DELETE: 4,
        };
        const createPayload = {
          ...formState,
          methods: formState.methods.map((m) => methodMap[m] ?? m),
        };
        await createPermission(createPayload, accessToken);
      }
      setModalOpen(false);
      setEditingId(null);
      setFormState({ name: "", path: "", methods: [], description: "" });
      fetchData();
    } catch (err) {
      setError("Error al guardar el permiso");
    }
  };

  // Edit permission
  const handleEdit = (item) => {
    setFormState({
      name: item.name,
      path: item.path,
      methods: Array.isArray(item.methods)
        ? item.methods.map((m) => (typeof m === "string" ? m : m.name))
        : [],
      description: item.description || "",
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  // Delete permission
  const handleDelete = async (id) => {
    try {
      await deletePermission(id, accessToken);
      fetchData();
    } catch (err) {
      setError("Error al eliminar el permiso");
    }
  };

  if (!authorized) {
    return <Unauthorized />;
  }

  return (
    <div className="text-black">
      <div className="md:flex grid grid-cols-1 justify-between items-center mb-4 md:gap-2">
        <TextInput
          leftSection={<RiSearchLine />}
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={() => {
            setFormState({ name: "", path: "", methods: [], description: "" });
            setEditingId(null);
            setModalOpen(true);
          }}
          leftSection={<RiAddLine />}
          className="btn btn-sm btn-block mt-2"
        >
          Agregar
        </Button>
      </div>
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}
      <div className="overflow-x-auto rounded-md hidden md:block">
        <table className="table w-full">
          <thead className="bg-primary text-white text-md uppercase font-bold">
            <tr className="text-white">
              <th>Nombre</th>
              <th>Ruta</th>
              <th>Métodos</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white text-primary">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <Loader size="sm" color="black" />
                  <p className="mt-2 text-gray-500">Cargando...</p>
                </td>
              </tr>
            ) : permissions.length > 0 ? (
              permissions.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.path}</td>
                  <td>
                    {Array.isArray(item.methods)
                      ? item.methods
                          .map((m) => (typeof m === "string" ? m : m.name))
                          .join(", ")
                      : "—"}
                  </td>
                  <td>{item.description || "—"}</td>
                  <td className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      className="btn btn-sm"
                    >
                      <RiEdit2Line />
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-sm text-white"
                    >
                      <RiDeleteBin6Line />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No se encontraron datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista móvil */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <Loader size="sm" color="black" />
            <p className="mt-2 text-gray-500">Cargando...</p>
          </div>
        ) : permissions.length > 0 ? (
          permissions.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md "
            >
              <div className="mb-2">
                <span className="font-semibold">Nombre: </span>
                {item.name}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Ruta: </span>
                {item.path}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Métodos: </span>
                {Array.isArray(item.methods)
                  ? item.methods
                      .map((m) => (typeof m === "string" ? m : m.name))
                      .join(", ")
                  : "—"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Descripción: </span>
                {item.description || "—"}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  onClick={() => handleEdit(item)}
                  className="btn btn-info btn-sm w-full"
                >
                  <RiEdit2Line className="mr-1" /> Editar
                </Button>
                <Button
                  onClick={() => handleDelete(item.id)}
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
      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          value={page}
          onChange={setPage}
          total={totalPages}
          className="mt-6"
        />
      )}
      {/* Modal para Crear/Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Editar Permiso" : "Nuevo Permiso"}
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
          <TextInput
            label="Nombre"
            placeholder="Nombre"
            value={formState.name}
            onChange={(e) =>
              setFormState({ ...formState, name: e.target.value })
            }
          />
          <Select
            label="Ruta"
            placeholder="Selecciona una ruta"
            data={activeRoutes.map((route) => ({ value: route, label: route }))}
            value={formState.path}
            onChange={(value) => setFormState({ ...formState, path: value })}
            searchable
            creatable={false}
            nothingFoundMessage="Sin rutas"
            allowDeselect={false}
          />
          <MultiSelect
            label="Métodos"
            placeholder="Selecciona métodos"
            data={methodOptions}
            value={formState.methods}
            onChange={(value) => setFormState({ ...formState, methods: value })}
            searchable
          />
          <TextInput
            label="Descripción"
            placeholder="Descripción"
            value={formState.description}
            onChange={(e) =>
              setFormState({ ...formState, description: e.target.value })
            }
          />
          <Button
            className="btn btn-info btn-sm"
            fullWidth
            onClick={handleSave}
          >
            {editingId ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
