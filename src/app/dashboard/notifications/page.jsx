"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  getNotificationTypes,
} from "@/tada/services/notificationApi";
import {
  TextInput,
  Button,
  Modal,
  Loader,
  Notification,
  MultiSelect,
} from "@mantine/core";
import {
  RiAddLine,
  RiEditLine,
  RiSearchLine,
  RiDeleteBin6Line,
} from "react-icons/ri";
import ConfirmDeleteModal from "@/core/components/ConfirmDeleteModal";

const PERMISSION_PATH = "/dashboard/notifications";

export default function NotificationsPage() {
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [authorized, setAuthorized] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingNotification, setEditingNotification] = useState(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    notification_type: [],
    number: "",
  });

  // Filtro en la tabla
  const [searchValue, setSearchValue] = useState("");
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: "email",
    direction: "asc",
  });

  /* ------------------------- AUTORIZACIÓN ------------------------- */
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
    setAuthorized(!!hasPermission);
  }, [user]);

  /* ------------------------- FETCH NOTIFICATIONS ------------------------- */
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getNotifications(accessToken);
      setNotifications(data.results || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- FETCH NOTIFICATION TYPES ------------------------- */
  const fetchNotificationTypes = async () => {
    try {
      const data = await getNotificationTypes(accessToken);
      setNotificationTypes(data || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los tipos de notificaciones.");
    }
  };

  useEffect(() => {
    if (authorized && accessToken) {
      fetchNotifications();
      fetchNotificationTypes();
    }
  }, [authorized, accessToken]);

  /* ------------------------- FORM HANDLERS ------------------------- */
  const resetForm = () => {
    setFormData({
      email: "",
      notification_type: [],
      number: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setEditingNotification(null);
    setModalOpen(true);
  };

  const openEditModal = (notification) => {
    setFormData({
      email: notification.email,
      notification_type: notification.notification_type || [],
      number: notification.number || "",
    });
    setModalMode("edit");
    setEditingNotification(notification);
    setModalOpen(true);
  };

  const openDeleteModal = (notification) => {
    setDeletingNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validación: email y número no pueden estar ambos vacíos, ni ambos llenos
    const hasEmail = formData.email.trim() !== "";
    const hasNumber = formData.number.trim() !== "";

    if (!hasEmail && !hasNumber) {
      setError(
        "Debe ingresar email o número, no puede dejar ambos campos vacíos."
      );
      return;
    }

    if (hasEmail && hasNumber) {
      setError("Debe ingresar solo email o solo número, no ambos campos.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (modalMode === "create") {
        await createNotification(accessToken, formData);
        setSuccess("Notificación creada exitosamente.");
      } else {
        await updateNotification(accessToken, editingNotification.id, formData);
        setSuccess("Notificación actualizada exitosamente.");
      }

      setModalOpen(false);
      resetForm();
      fetchNotifications();
    } catch (err) {
      console.error(err);
      setError(
        modalMode === "create"
          ? "Error al crear la notificación."
          : "Error al actualizar la notificación."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteNotification(accessToken, deletingNotification.id);
      setSuccess("Notificación eliminada exitosamente.");
      setDeleteModalOpen(false);
      setDeletingNotification(null);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar la notificación.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- RENDER ------------------------------- */
  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-8 bg-white rounded-md shadow-lg">
        <p className="text-center text-red-500 font-bold">
          No tienes autorización para ver esta sección.
        </p>
      </div>
    );
  }

  // Filtro de notificaciones
  const filtered = notifications.filter(
    (notification) =>
      notification.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      notification.notification_type_list
        .toLowerCase()
        .includes(searchValue.toLowerCase()) ||
      (notification.number &&
        notification.number.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortStatus.direction === "asc" ? 1 : -1;
    if (sortStatus.columnAccessor === "is_active") {
      return dir * (a.is_active - b.is_active);
    }
    return (
      dir *
      a[sortStatus.columnAccessor].localeCompare(b[sortStatus.columnAccessor])
    );
  });

  // Preparar datos para el MultiSelect
  const notificationTypeOptions = notificationTypes.map((type) => ({
    value: type.id.toString(),
    label: type.get_notification_type_display,
  }));

  return (
    <div className="text-black">
      {/* Barra de búsqueda y botón de agregar */}
      <div className="md:flex grid grid-cols-1 justify-between items-center mb-4 md:gap-2">
        <TextInput
          leftSection={<RiSearchLine />}
          placeholder="Buscar por email, número o tipo de notificación..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          className="w-full"
        />
        <Button
          onClick={openCreateModal}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm btn-block mt-2"
        >
          Nueva Notificación
        </Button>
      </div>

      {/* Notificación de error */}
      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      {success && (
        <Notification color="green" className="mb-4">
          {success}
        </Notification>
      )}

      {/* Tabla Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-md">
        <table className="table w-full">
          <thead className="text-md uppercase font-bold bg-primary">
            <tr className="text-white">
              <th>Email</th>
              <th>Número</th>
              <th>Tipos de Notificación</th>
              <th>Estado</th>
              <th>Fecha de Creación</th>
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
            ) : sorted.length > 0 ? (
              sorted.map((notification) => (
                <tr key={notification.id}>
                  <td className="">{notification.email}</td>
                  <td className="">{notification.number || "—"}</td>
                  <td className="">{notification.notification_type_list}</td>
                  <td className="">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        notification.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {notification.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </td>
                  <td className="flex gap-2">
                    <Button
                      onClick={() => openEditModal(notification)}
                      className="btn btn-sm"
                    >
                      <RiEditLine />
                    </Button>
                    <Button
                      onClick={() => openDeleteModal(notification)}
                      className="btn btn-sm btn-error"
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
        ) : sorted.length > 0 ? (
          sorted.map((notification) => (
            <div
              key={notification.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
            >
              <div className="mb-2">
                <span className="font-semibold">Email: </span>
                {notification.email}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Número: </span>
                {notification.number || "—"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Tipos de Notificación: </span>
                {notification.notification_type_list}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Estado: </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    notification.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {notification.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Fecha de Creación: </span>
                {new Date(notification.created_at).toLocaleDateString()}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  onClick={() => openEditModal(notification)}
                  className="btn btn-info btn-sm w-full"
                >
                  <RiEditLine className="mr-1" /> Editar
                </Button>
                <Button
                  onClick={() => openDeleteModal(notification)}
                  className="btn btn-error btn-sm w-full"
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

      {/* Modal para Crear/Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === "create"
            ? "Crear Nueva Notificación"
            : "Editar Notificación"
        }
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Nota:</strong> Debe ingresar email O número, pero no ambos
              campos. Al menos uno de los dos debe estar lleno.
            </p>
          </div>

          <TextInput
            label="Email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.currentTarget.value })
            }
            error={
              formData.email.trim() !== "" && formData.number.trim() !== ""
                ? "No puede ingresar email y número al mismo tiempo"
                : null
            }
          />

          <TextInput
            label="Número"
            placeholder="Ingresa el número"
            value={formData.number}
            onChange={(e) =>
              setFormData({ ...formData, number: e.currentTarget.value })
            }
            error={
              formData.email.trim() !== "" && formData.number.trim() !== ""
                ? "No puede ingresar email y número al mismo tiempo"
                : null
            }
          />

          <MultiSelect
            label="Tipos de Notificación"
            placeholder="Selecciona los tipos de notificación"
            value={formData.notification_type.map((id) => id.toString())}
            onChange={(values) =>
              setFormData({
                ...formData,
                notification_type: values.map((id) => parseInt(id)),
              })
            }
            data={notificationTypeOptions}
            required
          />

          <Button
            className="btn btn-info btn-sm"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            disabled={
              loading ||
              formData.notification_type.length === 0 ||
              (formData.email.trim() === "" && formData.number.trim() === "") ||
              (formData.email.trim() !== "" && formData.number.trim() !== "")
            }
          >
            {modalMode === "create" ? "Crear" : "Actualizar"}
          </Button>
        </div>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Notificación"
        message={`¿Estás seguro de que quieres eliminar la notificación para ${deletingNotification?.email}?`}
        loading={loading}
      />
    </div>
  );
}
