"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  getAppPricesWithPrice,
  createAppPriceWithPrice,
  updateAppPriceWithPrice,
} from "@/tada/services/priceApi";
import {
  TextInput,
  Button,
  Modal,
  Loader,
  Notification,
  Select,
  Textarea,
} from "@mantine/core";
import { RiAddLine, RiEditLine, RiSearchLine } from "react-icons/ri";
import { APPS } from "@/tada/utils/constants";

const PERMISSION_PATH = "/dashboard/pricing";

export default function PricingPage() {
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [prices, setPrices] = useState([]);
  const [authorized, setAuthorized] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingPrice, setEditingPrice] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    app: "",
    name: "",
    description: "",
    price_data: {
      month: "",
      value: "",
    },
  });

  // Filtro en la tabla
  const [searchValue, setSearchValue] = useState("");
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: "name",
    direction: "asc",
  });

  /* ------------------------- AUTORIZACIÓN ------------------------- */
  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
    setAuthorized(!!hasPermission);
  }, [user]);

  /* ------------------------- FETCH PRICES ------------------------- */
  const fetchPrices = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAppPricesWithPrice(accessToken);
      setPrices(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los precios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized && accessToken) {
      fetchPrices();
    }
  }, [authorized, accessToken]);

  /* ------------------------- FORM HANDLERS ------------------------- */
  const getFirstDayOfCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  };

  const resetForm = () => {
    setFormData({
      app: "",
      name: "",
      description: "",
      price_data: {
        month: getFirstDayOfCurrentMonth(),
        value: "",
      },
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setEditingPrice(null);
    setModalOpen(true);
  };

  const openEditModal = (price) => {
    // Si el precio tiene un mes, usarlo, sino usar el primer día del mes actual
    const monthValue =
      price.price_details?.month || getFirstDayOfCurrentMonth();

    setFormData({
      app: price.app,
      name: price.name,
      description: price.description,
      price_data: {
        month: monthValue,
        value: price.price_details?.value?.toString() || "",
      },
    });
    setModalMode("edit");
    setEditingPrice(price);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (modalMode === "create") {
        await createAppPriceWithPrice(accessToken, formData);
        setSuccess("Precio creado exitosamente.");
      } else {
        await updateAppPriceWithPrice(accessToken, editingPrice.id, formData);
        setSuccess("Precio actualizado exitosamente.");
      }

      setModalOpen(false);
      resetForm();
      fetchPrices();
    } catch (err) {
      console.error(err);
      setError(
        modalMode === "create"
          ? "Error al crear el precio."
          : "Error al actualizar el precio."
      );
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

  // Filtro de precios
  const filtered = prices.filter(
    (price) =>
      price.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      price.app_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      price.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortStatus.direction === "asc" ? 1 : -1;
    if (sortStatus.columnAccessor === "value") {
      return (
        dir * ((a.price_details?.value || 0) - (b.price_details?.value || 0))
      );
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
          placeholder="Buscar por nombre, app o descripción..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          className="w-full"
        />
        <Button
          onClick={openCreateModal}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm btn-block mt-2"
        >
          Nuevo Precio
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
              <th>Nombre</th>
              <th>App</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Mes</th>
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
              sorted.map((price) => (
                <tr key={price.id}>
                  <td className="">{price.name}</td>
                  <td className="">{price.app_name}</td>
                  <td className="">{price.description}</td>
                  <td className="">${price.price_details?.value || 0}</td>
                  <td className="">{price.price_details?.month || "N/A"}</td>
                  <td className="flex gap-2">
                    <Button
                      onClick={() => openEditModal(price)}
                      className="btn btn-sm"
                    >
                      <RiEditLine />
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
          sorted.map((price) => (
            <div
              key={price.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-md"
            >
              <div className="mb-2">
                <span className="font-semibold">Nombre: </span>
                {price.name}
              </div>
              <div className="mb-2">
                <span className="font-semibold">App: </span>
                {price.app_name}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Descripción: </span>
                {price.description}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Precio: </span>$
                {price.price_details?.value || 0}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Mes: </span>
                {price.price_details?.month || "N/A"}
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                <Button
                  onClick={() => openEditModal(price)}
                  className="btn btn-info btn-sm w-full"
                >
                  <RiEditLine className="mr-1" /> Editar
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
        title={modalMode === "create" ? "Crear Nuevo Precio" : "Editar Precio"}
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
          <Select
            label="App"
            placeholder="Selecciona una app"
            value={formData.app}
            onChange={(value) => setFormData({ ...formData, app: value })}
            data={APPS}
            required
          />

          <TextInput
            label="Nombre"
            placeholder="Ej: PUSH, CANVAS"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.currentTarget.value })
            }
            required
          />

          <Textarea
            label="Descripción"
            placeholder="Descripción del precio"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.currentTarget.value })
            }
            required
          />

          <TextInput
            label="Mes"
            type="date"
            value={formData.price_data.month}
            onChange={(e) =>
              setFormData({
                ...formData,
                price_data: {
                  ...formData.price_data,
                  month: e.currentTarget.value,
                },
              })
            }
            required
          />

          <TextInput
            label="Valor"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.price_data.value}
            onChange={(e) =>
              setFormData({
                ...formData,
                price_data: {
                  ...formData.price_data,
                  value: e.currentTarget.value,
                },
              })
            }
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
    </div>
  );
}
