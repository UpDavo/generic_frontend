"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from "@/services/pushApi";
import {
  Loader,
  TextInput,
  Button,
  Notification,
  Pagination,
  Modal,
} from "@mantine/core";
import {
  RiAddLine,
  RiSearchLine,
  RiEdit2Line,
  RiDeleteBin6Line,
} from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";

export default function MessagePage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  // Estado para verificar permisos de acceso
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Estados para la data, form y manejo de errores/carga
  const [data, setData] = useState<any[]>([]);
  const [formState, setFormState] = useState({
    notification_type: "",
    name: "",
    title: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para paginación, búsqueda y modal
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Verifica permisos al montar el componente o cuando cambie "user"
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

  // Una vez tenemos el token, la página actual o el query de búsqueda cambian,
  // hacemos la llamada a la API con un pequeño delay para no saturar el endpoint.
  useEffect(() => {
    if (accessToken && authorized) {
      const delaySearch = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [accessToken, page, searchQuery, authorized]);

  // Función que obtiene la data desde tu servicio
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listMessages(accessToken, page, searchQuery);
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

  // Maneja la eliminación de un item
  const handleDelete = async (id: number) => {
    try {
      await deleteMessage(id, accessToken);
      await fetchData();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar el registro");
    }
  };

  // Maneja la creación/edición de un item
  const handleSave = async () => {
    // Validación sencilla para asegurarnos que no haya campos vacíos
    if (
      !formState.notification_type.trim() ||
      !formState.name.trim() ||
      !formState.title.trim() ||
      !formState.message.trim()
    ) {
      // Podrías mostrar un mensaje más descriptivo
      console.log("Formulario incompleto:", formState);
      return;
    }

    try {
      if (editingId) {
        // Actualiza
        await updateMessage(editingId, formState, accessToken);
      } else {
        // Crea nuevo
        await createMessage(formState, accessToken);
      }
      await fetchData();
      setFormState({ notification_type: "", name: "", title: "", message: "" });
      setModalOpen(false);
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al guardar el registro");
    }
  };

  // Si todavía no se sabe si está autorizado o no, mostramos un Loader
  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  // Si no tiene permiso, se muestra mensaje de acceso denegado
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
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={() => {
            setFormState({
              notification_type: "",
              name: "",
              title: "",
              message: "",
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

      {/* Notificación de error (si existe) */}
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
                <tr className="text-white font-bold">
                  {/* <th>ID</th> */}
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Título</th>
                  <th>Mensaje</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <Loader size="sm" color="blue" />
                      <p className="mt-2 text-gray-500">Cargando...</p>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id}>
                      {/* <td>{item.id}</td> */}
                      <td className="uppercase badge badge-info font-bold mx-3">
                        {item.notification_type || "—"}
                      </td>
                      <td className="uppercase dark:text-slate-700">
                        {item.name || "—"}
                      </td>
                      <td className="uppercase dark:text-slate-700">
                        {item.title || "—"}
                      </td>
                      <td className="dark:text-slate-700">
                        {item.message || "—"}
                      </td>
                      <td className="flex gap-2">
                        <Button
                          onClick={() => {
                            setFormState({
                              notification_type: item.notification_type,
                              name: item.name,
                              title: item.title,
                              message: item.message,
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
                    <td colSpan={5} className="text-center py-4">
                      No se encontraron datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Vista Móvil */}
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
                    className="border rounded-lg p-4 bg-white shadow-md dark:text-slate-700"
                  >
                    <div className="mb-2">
                      <span className="font-semibold">ID: </span>
                      {item.id}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Tipo: </span>
                      {item.notification_type || "—"}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Título: </span>
                      {item.title || "—"}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Nombre: </span>
                      {item.name || "—"}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Mensaje: </span>
                      {item.message || "—"}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button
                        onClick={() => {
                          setFormState({
                            notification_type: item.notification_type,
                            name: item.name,
                            title: item.title,
                            message: item.message,
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
        title={editingId ? "Editar Mensaje" : "Nuevo Mensaje"}
        centered
        className="dark:text-slate-700"
      >
        <div className="space-y-4 dark:text-slate-700">
          <TextInput
            label="Tipo"
            placeholder="Identificador único"
            value={formState.notification_type}
            onChange={(e) =>
              setFormState({ ...formState, notification_type: e.target.value })
            }
          />
          <TextInput
            label="Título"
            placeholder="Título"
            value={formState.title}
            onChange={(e) =>
              setFormState({ ...formState, title: e.target.value })
            }
          />
          <TextInput
            label="Nombre"
            placeholder="Nombre"
            value={formState.name}
            onChange={(e) =>
              setFormState({ ...formState, name: e.target.value })
            }
          />
          <TextInput
            label="Mensaje"
            placeholder="Mensaje"
            value={formState.message}
            onChange={(e) =>
              setFormState({ ...formState, message: e.target.value })
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
