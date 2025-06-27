"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  usersList,
  createUser,
  userUpdate,
  deleteUser,
} from "@/auth/services/userApi";
import { listAllRoles } from "@/auth/services/roleApi";
import { useAuth } from "@/auth/hooks/useAuth";
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
// import { SimpleUser, SimpleUserPass } from "@/core/interfaces/user";
import { Unauthorized } from "@/core/components/Unauthorized";
import ConfirmDeleteModal from "@/core/components/ConfirmDeleteModal";


const PERMISSION_PATH = "/users";


export default function UserPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  //delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(0);
  const [deleteTargetName, setDeleteTargetName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const openConfirmDelete = (id, name) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (deleteTargetId) {
      setIsDeleting(true);
      try {
        await deleteUser(deleteTargetId, accessToken);
        await fetchData();
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el registro");
      } finally {
        setIsDeleting(false);
        setConfirmDeleteOpen(false);
        setDeleteTargetId(null);
        setDeleteTargetName(null);
      }
    }
  };

  // Estado para verificar permisos de acceso
  const [authorized, setAuthorized] = useState(false);

  // Estados para la data (usuarios), roles y form
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "",
  });

  // Estados para manejo de errores y de carga
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para paginación, búsqueda, modal y edición
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // console.log(user);

  // Verificar permisos
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
  const roleOptions = roles.map((role) => ({
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

  // // Manejar eliminación
  // const handleDelete = async (id: number) => {
  //   try {
  //     await deleteUser(id, accessToken);
  //     await fetchData();
  //     setError(null);
  //   } catch (err) {
  //     console.error(err);
  //     setError("Error al eliminar el registro");
  //   }
  // };

  // Manejar guardado (crear o editar)
  const handleSave = async () => {
    if (editingId) {
      // userUpdate (SimpleUser) --> sin password
      const simpleUser = {
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
      const simpleUserPass = {
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
    return <Unauthorized />;
  }

  return (
    <div className="text-black">
      {/* Barra de búsqueda y botón de agregar */}
      <div className="md:flex grid grid-cols-1 justify-between items-center mb-4 md:gap-2">
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
          className="btn btn-info btn-sm btn-block mt-2"
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
      <div className="hidden md:block overflow-x-auto rounded-md">
        <table className="table w-full">
          <thead className="text-md uppercase font-bold bg-primary">
            <tr className="text-white">
              <th>Email</th>
              <th>Nombre</th>
              {/* <th>Apellido</th>
                  <th>Teléfono</th> */}
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white text-primary">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <Loader size="sm" color="black" />
                  <p className="mt-2 text-gray-500">Cargando...</p>
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id}>
                  <td className="">{item.email}</td>
                  <td className="">{item.first_name}</td>
                  {/* <td className="">{item.last_name}</td>
                      <td className="">{item.phone_number || "—"}</td> */}
                  <td className="">{item.role_name || "—"}</td>
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
                      className="btn btn-sm"
                    >
                      <RiEdit2Line />
                    </Button>
                    <Button
                      onClick={() =>
                        openConfirmDelete(item.id, item.first_name)
                      }
                      className="btn btn-sm text-white"
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
      </div>

      {/* Vista móvil */}
      <div className="md:hidden block space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <Loader size="sm" color="black" />
            <p className="mt-2 text-gray-500">Cargando...</p>
          </div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md "
            >
              <div className="mb-2">
                <span className="font-semibold">Email: </span>
                {item.email}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Nombre: </span>
                {item.first_name}
              </div>
              {/* <div className="mb-2">
                      <span className="font-semibold">Apellido: </span>
                      {item.last_name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Teléfono: </span>
                      {item.phone_number || "—"}
                    </div> */}
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
                  onClick={() => openConfirmDelete(item.id, item.first_name)}
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

      <ConfirmDeleteModal
        opened={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        itemName={deleteTargetName}
        loading={isDeleting}
      />

      {/* Modal para Crear/Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Editar Usuario" : "Nuevo Usuario"}
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
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
