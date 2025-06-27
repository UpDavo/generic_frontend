"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
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
} from "@mantine/core";
import {
  RiAddLine,
  RiSearchLine,
  RiEdit2Line,
  RiDeleteBin6Line,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { Unauthorized } from "@/core/components/Unauthorized";

const PERMISSION_PATH = "/dashboard/user/roles";

export default function RolePage() {
  const { accessToken, user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    is_admin: false,
    permissions: [],
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

  useEffect(() => {
    if (accessToken) {
      fetchData();
      fetchPermissions();
    }
  }, [accessToken, page, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listRoles(accessToken);
      setRoles(data.results || data); // soporta paginado o no
      setTotalPages(Math.ceil((data.count || data.length) / 10));
      setError(null);
    } catch (err) {
      setError("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await listPermissions(accessToken);
      setPermissions(data.results || data);
    } catch (err) {
      setPermissions([]);
    }
  };

  const handleSave = async () => {
    if (!formState.name) return;
    try {
      if (editingId) {
        await updateRole(
          editingId,
          {
            ...formState,
            permissions: formState.permissions.map((id) => Number(id)),
          },
          accessToken
        );
      } else {
        await createRole(
          {
            ...formState,
            permissions: formState.permissions.map((id) => Number(id)),
          },
          accessToken
        );
      }
      setModalOpen(false);
      setEditingId(null);
      setFormState({
        name: "",
        description: "",
        is_admin: false,
        permissions: [],
      });
      fetchData();
    } catch (err) {
      setError("Error al guardar el rol");
    }
  };

  const handleEdit = (item) => {
    setFormState({
      name: item.name,
      description: item.description || "",
      is_admin: !!item.is_admin,
      permissions: Array.isArray(item.permissions)
        ? item.permissions.map((p) => p.id?.toString() || p.toString())
        : [],
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteRole(id, accessToken);
      fetchData();
    } catch (err) {
      setError("Error al eliminar el rol");
    }
  };

  const permissionOptions = permissions.map((perm) => ({
    value: perm.id?.toString() || perm.toString(),
    label: perm.name,
  }));

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
            setFormState({
              name: "",
              description: "",
              is_admin: false,
              permissions: [],
            });
            setEditingId(null);
            setModalOpen(true);
          }}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm btn-block mt-2"
        >
          Agregar
        </Button>
      </div>
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}
      <div className="hidden md:block overflow-x-auto rounded-md">
        <table className="table w-full ">
          <thead className="bg-primary text-white text-md uppercase font-bold">
            <tr className="text-white">
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Administrador</th>
              <th>Permisos</th>
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
            ) : roles.length > 0 ? (
              roles.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.description || "—"}</td>
                  <td>{item.is_admin ? "Sí" : "No"}</td>
                  <td>
                    {Array.isArray(item.permissions)
                      ? item.permissions.map((p) => p.name).join(", ")
                      : "—"}
                  </td>
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
        ) : roles.length > 0 ? (
          roles.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md "
            >
              <div className="mb-2">
                <span className="font-semibold">Nombre: </span>
                {item.name}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Descripción: </span>
                {item.description || "—"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Administrador: </span>
                {item.is_admin ? "Sí" : "No"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Permisos: </span>
                {Array.isArray(item.permissions)
                  ? item.permissions.map((p) => p.name).join(", ")
                  : "—"}
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
        title={editingId ? "Editar Rol" : "Nuevo Rol"}
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
          <TextInput
            label="Descripción"
            placeholder="Descripción"
            value={formState.description}
            onChange={(e) =>
              setFormState({ ...formState, description: e.target.value })
            }
          />
          <Checkbox
            label="Administrador"
            checked={formState.is_admin}
            onChange={(e) =>
              setFormState({ ...formState, is_admin: e.currentTarget.checked })
            }
          />
          <MultiSelect
            label="Permisos"
            placeholder="Selecciona permisos"
            data={permissionOptions}
            value={formState.permissions.map(String)}
            onChange={(value) =>
              setFormState({ ...formState, permissions: value })
            }
            searchable
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
