"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  getDailyMetas,
  createDailyMeta,
  updateDailyMeta,
  deleteDailyMeta,
} from "@/tada/services/dailyMetaApi";
import {
  TextInput,
  Button,
  Modal,
  Loader,
  Notification,
  NumberInput,
} from "@mantine/core";
import {
  RiAddLine,
  RiEditLine,
  RiSearchLine,
  RiDeleteBin6Line,
} from "react-icons/ri";
import ConfirmDeleteModal from "@/core/components/ConfirmDeleteModal";

const PERMISSION_PATH = "/dashboard/reports/goal";

export default function GoalReportsPage() {
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dailyMetas, setDailyMetas] = useState([]);
  const [authorized, setAuthorized] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingDailyMeta, setEditingDailyMeta] = useState(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDailyMeta, setDeletingDailyMeta] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    date: "",
    target_count: "",
  });

  // Filtro en la tabla
  const [searchValue, setSearchValue] = useState("");
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: "date",
    direction: "desc",
  });

  /* ------------------------- AUTORIZACIÓN ------------------------- */
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
    setAuthorized(!!hasPermission);
  }, [user]);

  /* ------------------------- FETCH DAILY METAS ------------------------- */
  const fetchDailyMetas = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getDailyMetas(accessToken);
      setDailyMetas(data || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las daily meta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized && accessToken) {
      fetchDailyMetas();
    }
  }, [authorized, accessToken]);

  /* ------------------------- FORM HANDLERS ------------------------- */
  const resetForm = () => {
    setFormData({
      date: "",
      target_count: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setEditingDailyMeta(null);
    setModalOpen(true);
  };

  const openEditModal = (dailyMeta) => {
    setFormData({
      date: dailyMeta.date,
      target_count: dailyMeta.target_count.toString(),
    });
    setModalMode("edit");
    setEditingDailyMeta(dailyMeta);
    setModalOpen(true);
  };

  const openDeleteModal = (dailyMeta) => {
    setDeletingDailyMeta(dailyMeta);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = {
        date: formData.date,
        target_count: parseInt(formData.target_count),
      };

      if (modalMode === "create") {
        await createDailyMeta(accessToken, submitData);
        setSuccess("Daily meta creada exitosamente.");
      } else {
        await updateDailyMeta(accessToken, editingDailyMeta.id, submitData);
        setSuccess("Daily meta actualizada exitosamente.");
      }

      setModalOpen(false);
      resetForm();
      fetchDailyMetas();
    } catch (err) {
      console.error(err);
      setError(
        modalMode === "create"
          ? "Error al crear la daily meta."
          : "Error al actualizar la daily meta."
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
      await deleteDailyMeta(accessToken, deletingDailyMeta.id);
      setSuccess("Daily meta eliminada exitosamente.");
      setDeleteModalOpen(false);
      setDeletingDailyMeta(null);
      fetchDailyMetas();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar la daily meta.");
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

  // Filtro de daily metas
  const filtered = dailyMetas.filter(
    (dailyMeta) =>
      dailyMeta.date.toLowerCase().includes(searchValue.toLowerCase()) ||
      dailyMeta.target_count.toString().includes(searchValue)
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortStatus.direction === "asc" ? 1 : -1;
    if (sortStatus.columnAccessor === "target_count") {
      return dir * (a.target_count - b.target_count);
    }
    if (sortStatus.columnAccessor === "date") {
      return dir * new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return (
      dir *
      a[sortStatus.columnAccessor].localeCompare(b[sortStatus.columnAccessor])
    );
  });

  return (
    <div className="text-black">
      {/* Barra de búsqueda y botón de agregar */}
      <div className="md:flex grid grid-cols-1 justify-between items-center mb-4 md:gap-2">
        <TextInput
          leftSection={<RiSearchLine />}
          placeholder="Buscar por fecha o target count..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          className="w-full"
        />
        <Button
          onClick={openCreateModal}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm btn-block mt-2"
        >
          Nueva Meta
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
              <th>Fecha</th>
              <th>Meta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white text-primary">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  <Loader size="sm" color="black" />
                  <p className="mt-2 text-gray-500">Cargando...</p>
                </td>
              </tr>
            ) : sorted.length > 0 ? (
              sorted.map((dailyMeta) => (
                <tr key={dailyMeta.id}>
                  <td className="">{dailyMeta.date}</td>
                  <td className="">{dailyMeta.target_count}</td>
                  <td className="flex gap-2">
                    <Button
                      onClick={() => openEditModal(dailyMeta)}
                      className="btn btn-sm"
                    >
                      <RiEditLine />
                    </Button>
                    <Button
                      onClick={() => openDeleteModal(dailyMeta)}
                      className="btn btn-sm"
                    >
                      <RiDeleteBin6Line />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">
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
          sorted.map((dailyMeta) => (
            <div
              key={dailyMeta.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
            >
              <div className="mb-2">
                <span className="font-semibold">Fecha: </span>
                {dailyMeta.date}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Target Count: </span>
                {dailyMeta.target_count}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Rango de Horas: </span>
                {dailyMeta.work_hours_range
                  ? `${dailyMeta.work_hours_range[0]}:00 - ${dailyMeta.work_hours_range[1]}:00`
                  : "No definido"}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  onClick={() => openEditModal(dailyMeta)}
                  className="btn btn-info btn-sm w-full"
                >
                  <RiEditLine className="mr-1" /> Editar
                </Button>
                <Button
                  onClick={() => openDeleteModal(dailyMeta)}
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
        title={modalMode === "create" ? "Crear Nueva Meta" : "Editar Meta"}
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
          <TextInput
            label="Fecha"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.currentTarget.value })
            }
            required
          />

          <NumberInput
            label="Target Count"
            placeholder="Ingrese el target count"
            value={formData.target_count}
            onChange={(value) =>
              setFormData({
                ...formData,
                target_count: value?.toString() || "",
              })
            }
            min={0}
            required
          />

          <Button
            className="btn btn-info btn-sm"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
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
        title="Eliminar Daily Meta"
        message={`¿Estás seguro de que quieres eliminar la daily meta del ${deletingDailyMeta?.date}?`}
        loading={loading}
      />
    </div>
  );
}
