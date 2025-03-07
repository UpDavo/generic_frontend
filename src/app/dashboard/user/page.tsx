"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  usersList,
  createUser,
  userUpdate,
  deleteUser,
} from "@/services/userApi";
import { listAllRoles } from "@/services/roleApi";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader,
  TextInput,
  Button,
  Notification,
  Pagination,
  Modal,
  Select,
} from "@mantine/core";
import {
  RiAddLine,
  RiSearchLine,
  RiEdit2Line,
  RiDeleteBin6Line,
} from "react-icons/ri";
import { SimpleUser, SimpleUserPass } from "@/interfaces/user";

interface FormState {
  email: string;
  password?: string; // opcional
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string; // lo tienes como string, luego lo casteas a number
}

export default function UserPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  // Estado para verificar permisos de acceso
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Estados para la data (usuarios), roles y form
  const [data, setData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [formState, setFormState] = useState<FormState>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "",
  });

  // Estados para manejo de errores y de carga
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para paginación, búsqueda, modal y edición
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Verificar permisos
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === "/push");

    if (hasPermission) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, router]);

  // Cargar lista de roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await listAllRoles(accessToken);
        setRoles(rolesData);
      } catch (err) {
        console.error("Error al cargar los roles:", err);
      }
    };

    if (accessToken) {
      fetchRoles();
    }
  }, [accessToken]);

  // Transformar roles a formato Select de Mantine
  const roleOptions = roles.map((role: any) => ({
    value: role.id.toString(),
    label: role.name,
  }));

  // Cargar usuarios cada vez que cambie la página, el query o la autorización
  useEffect(() => {
    if (accessToken && authorized) {
      const delaySearch = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [accessToken, page, searchQuery, authorized]);

  // Función para obtener usuarios
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await usersList(accessToken, page, searchQuery);
      setData(response.results || []);
      const pages = Math.ceil(response.count / 10);
      setTotalPages(pages);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id, accessToken);
      await fetchData();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar el registro");
    }
  };

  // Manejar guardado (crear o editar)
  const handleSave = async () => {
    if (editingId) {
      // userUpdate (SimpleUser) --> sin password
      const simpleUser: SimpleUser = {
        email: formState.email,
        first_name: formState.first_name,
        last_name: formState.last_name,
        phone_number: formState.phone_number,
        role: formState.role ? parseInt(formState.role) : 0,
      };
      await userUpdate(editingId, simpleUser, accessToken, user?.id);
    } else {
      // createUser (SimpleUserPass) --> con password
      // Valida que "password" no sea vacío si es que la API la requiere
      if (!formState.password) {
        // Maneja el error, por ejemplo:
        console.error("Falta password al crear un usuario");
        return;
      }
      const simpleUserPass: SimpleUserPass = {
        email: formState.email,
        password: formState.password,
        first_name: formState.first_name,
        last_name: formState.last_name,
        phone_number: formState.phone_number,
        role: formState.role ? parseInt(formState.role) : 0,
      };
      await createUser(simpleUserPass, accessToken);
    }
    await fetchData();
    setFormState({
      email: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      role: "",
    });
    setModalOpen(false);
    setEditingId(null);
    setError(null);
  };

  // Si todavía no se sabe si está autorizado o no
  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  // Si no tiene permiso
  if (!authorized) {
    return (
      <div className="flex flex-col justify-center items-center mt-64">
        <h1 className="text-3xl font-bold text-red-500">Acceso Denegado</h1>
        <p className="mt-2 text-gray-600">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Barra de búsqueda y botón de agregar */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <TextInput
          leftSection={<RiSearchLine />}
          placeholder="Buscar por email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={() => {
            setFormState({
              email: "",
              first_name: "",
              last_name: "",
              phone_number: "",
              role: "",
            });
            setEditingId(null);
            setModalOpen(true);
          }}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm"
        >
          Agregar
        </Button>
      </div>

      {/* Notificación de error */}
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      {/* Tabla Desktop */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto rounded-md">
            <table className="table w-full hidden md:table">
              <thead className="bg-info text-white text-md uppercase font-bold">
                <tr className="text-white">
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <Loader size="sm" color="blue" />
                      <p className="mt-2 text-gray-500">Cargando...</p>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id}>
                      <td className="">{item.email}</td>
                      <td className="">{item.first_name}</td>
                      <td className="">{item.last_name}</td>
                      <td className="">
                        {item.phone_number || "—"}
                      </td>
                      <td className="">
                        {item.role_name || "—"}
                      </td>
                      <td className="flex gap-2">
                        <Button
                          onClick={() => {
                            setFormState({
                              email: item.email,
                              first_name: item.first_name,
                              last_name: item.last_name,
                              phone_number: item.phone_number || "",
                              role: item.role ? item.role.toString() : "",
                            });
                            setEditingId(item.id);
                            setModalOpen(true);
                          }}
                          className="btn btn-info btn-sm"
                        >
                          <RiEdit2Line />
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-error btn-sm text-white"
                        >
                          <RiDeleteBin6Line />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No se encontraron datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Vista móvil */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <div className="flex flex-col items-center py-4">
                  <Loader size="sm" color="blue" />
                  <p className="mt-2 text-gray-500">Cargando...</p>
                </div>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-white shadow-md "
                  >
                    <div className="mb-2">
                      <span className="font-semibold">Email: </span>
                      {item.email}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Nombre: </span>
                      {item.first_name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Apellido: </span>
                      {item.last_name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Teléfono: </span>
                      {item.phone_number || "—"}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Rol: </span>
                      {item.role_name || "—"}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button
                        onClick={() => {
                          setFormState({
                            email: item.email,
                            first_name: item.first_name,
                            last_name: item.last_name,
                            phone_number: item.phone_number || "",
                            role: item.role ? item.role.toString() : "",
                          });
                          setEditingId(item.id);
                          setModalOpen(true);
                        }}
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
        </div>
      </div>

      {/* Modal para Crear/Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Editar Usuario" : "Nuevo Usuario"}
        centered
        className=""
      >
        <div className="space-y-4 ">
          <TextInput
            label="Email"
            placeholder="Email"
            value={formState.email}
            onChange={(e) =>
              setFormState({ ...formState, email: e.target.value })
            }
          />
          {!editingId && (
            <TextInput
              label="Contraseña"
              placeholder="Contraseña"
              value={formState.password}
              onChange={(e) =>
                setFormState({ ...formState, password: e.target.value })
              }
            />
          )}

          <TextInput
            label="Nombre"
            placeholder="Nombre"
            value={formState.first_name}
            onChange={(e) =>
              setFormState({ ...formState, first_name: e.target.value })
            }
          />
          <TextInput
            label="Apellido"
            placeholder="Apellido"
            value={formState.last_name}
            onChange={(e) =>
              setFormState({ ...formState, last_name: e.target.value })
            }
          />
          <TextInput
            label="Teléfono"
            placeholder="Teléfono"
            value={formState.phone_number}
            onChange={(e) =>
              setFormState({ ...formState, phone_number: e.target.value })
            }
          />
          <Select
            className=""
            label="Rol"
            placeholder="Selecciona un rol"
            data={roleOptions}
            value={formState.role}
            onChange={(value) => {
              setFormState({ ...formState, role: value || "" });
            }}
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
