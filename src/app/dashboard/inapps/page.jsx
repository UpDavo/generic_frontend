"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCanvasMessage,
  createCanvasMessage,
  updateCanvasMessage,
  listCanvasMessages,
} from "@/tada/services/canvasApi";
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
  RiRefreshLine,
} from "react-icons/ri";
import { useAuth } from "@/auth/hooks/useAuth";
import { Unauthorized } from "@/core/components/Unauthorized";
import ConfirmDeleteModal from "@/core/components/ConfirmDeleteModal";
import NotificationTD from "@/core/components/NotificationTD";

const PERMISSION_PATH = "/dashboard/inapps";

export default function MessagePage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  // Estado para verificar permisos de acceso
  const [authorized, setAuthorized] = useState(null);

  // Estados para la data, form y manejo de errores/carga
  const [data, setData] = useState([]);
  const [formState, setFormState] = useState({
    name: "",
    braze_id: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para paginación, búsqueda y modal
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  //delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState(null);
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
        await deleteCanvasMessage(deleteTargetId, accessToken);
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

  // Verifica permisos al montar el componente o cuando cambie "user"
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
      const response = await listCanvasMessages(accessToken, page, searchQuery);
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

  // Maneja la creación/edición de un item
  const handleSave = async () => {
    // Validación sencilla para asegurarnos que no haya campos vacíos
    if (!formState.name.trim() || !formState.braze_id.trim()) {
      // Podrías mostrar un mensaje más descriptivo
      console.log("Formulario incompleto:", formState);
      return;
    }

    try {
      if (editingId) {
        // Actualiza
        await updateCanvasMessage(editingId, formState, accessToken);
      } else {
        // Crea nuevo
        await createCanvasMessage(formState, accessToken);
      }
      await fetchData();
      setFormState({ braze_id: "", name: "" });
      setModalOpen(false);
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al guardar el registro");
    }
  };

  const refreshData = () => {
    fetchData();
  };

  // Si todavía no se sabe si está autorizado o no, mostramos un Loader
  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!authorized) {
    return <Unauthorized />;
  }

  return (
    <div>
      {/* Barra de búsqueda y botón de agregar */}
      <div className="md:flex grid grid-cols-1 w-full justify-between items-center mb-4 gap-2">
        <TextInput
          leftSection={<RiSearchLine />}
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
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
          <Button
            onClick={refreshData}
            variant="filled"
            leftSection={<RiRefreshLine />}
            className="btn btn-primary btn-sm"
          >
            Refrescar
          </Button>
        </div>
      </div>

      {/* Notificación de error (si existe) */}
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      {/* Tabla Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-md">
        <table className="table w-full">
          <thead className="bg-primary text-white text-md uppercase font-bold">
            <tr className="text-white font-bold">
              {/* <th>ID</th> */}
              <th>Nombre</th>
              <th>Identificador</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white text-black">
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

                  <td className="uppercase ">{item.name || "—"}</td>
                  <td className="">{item.braze_id || "—"}</td>
                  <td className="flex gap-2">
                    <Button
                      onClick={() => {
                        setFormState({
                          name: item.name,
                          braze_id: item.braze_id,
                        });
                        setEditingId(item.id);
                        setModalOpen(true);
                      }}
                      className="btn btn-sm"
                    >
                      <RiEdit2Line />
                    </Button>
                    <Button
                      onClick={() => openConfirmDelete(item.id, item.name)}
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

      {/* Vista Móvil */}
      <div className="md:hidden block space-y-4 text-black">
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <Loader size="sm" color="blue" />
            <p className="mt-2 text-gray-500">Cargando...</p>
          </div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md "
            >
              {/* <div className="mb-2">
                      <span className="font-semibold">ID: </span>
                      {item.id}
                    </div> */}
              <div className="mb-2 mt-2">
                <span className="font-semibold">{item.name || "—"}</span>
              </div>
              <div className="mb-2">
                <span className="font-semibold">{item.braze_id || "—"}</span>
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

      <ConfirmDeleteModal
        opened={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        itemName={deleteTargetName}
        loading={isDeleting}
      />

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
        title={editingId ? "Editar Mensaje" : "Nuevo Mensaje"}
        className="text-black"
        centered
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
            label="Identificador"
            placeholder="Identificador"
            value={formState.braze_id}
            onChange={(e) =>
              setFormState({ ...formState, braze_id: e.target.value })
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
