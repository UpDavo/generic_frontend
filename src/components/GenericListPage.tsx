import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Button,
  TextInput,
  Notification,
  Pagination,
  Modal,
  MultiSelect,
  Checkbox,
  Select,
} from "@mantine/core";
import { RiAddLine, RiSearchLine } from "react-icons/ri";
import GenericTable from "./GenericTable";

interface GenericListPageProps {
  title?: string;
  fetchFunction?: any;
  createFunction?: any;
  updateFunction?: any;
  deleteFunction?: any;
  columns?: any;
  initialFormState?: any;
  isMultiSelectFields?: any;
  isDropdown?: any;
  multiData?: any;
}

const GenericListPage = ({
  title = "",
  fetchFunction,
  createFunction,
  updateFunction,
  deleteFunction,
  columns,
  initialFormState,
  isMultiSelectFields = {},
  isDropdown = {},
  multiData = {},
}: GenericListPageProps) => {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState([]);
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (accessToken) {
      const delaySearch = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delaySearch);
    }
  }, [accessToken, page, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchFunction(accessToken, page, searchQuery);
      console.log(data.results);
      setData(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteFunction(id, accessToken);
      fetchData();
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al eliminar el registro");
    }
  };

  const handleSave = async () => {
    if (
      Object.values(formState).some((value) => value === "" || value === null)
    ) {
      console.log("Formulario incompleto:", formState);
      return;
    }

    try {
      if (editingId) {
        await updateFunction(editingId, formState, accessToken, user?.id);
      } else {
        await createFunction(formState, accessToken);
      }
      fetchData();
      setFormState(initialFormState);
      setModalOpen(false);
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al guardar el registro");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <TextInput
          leftSection={<RiSearchLine />}
          placeholder={`Buscar por ${columns[0].title.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={() => {
            setFormState(initialFormState);
            setEditingId(null);
            setModalOpen(true);
          }}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm"
        >
          Agregar
        </Button>
      </div>

      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <GenericTable
            columns={columns}
            data={data}
            loading={loading}
            onEdit={(item: any) => {
              setFormState(item);
              setEditingId(item.id);
              setModalOpen(true);
            }}
            onDelete={handleDelete}
          />
          <Pagination
            value={page}
            onChange={(newPage) => setPage(newPage)}
            total={totalPages}
            className="mt-6"
          />
        </div>
      </div>

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? `Editar ${title}` : `Nuevo ${title}`}
        centered
      >
        <div className="space-y-4">
          {Object.keys(initialFormState).map((key) => {
            if (isMultiSelectFields[key]) {
              // MultiSelect para campos como "permissions" o "methods"
              return (
                <MultiSelect
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  data={multiData[key]}
                  value={formState[key]}
                  onChange={(values) =>
                    setFormState({ ...formState, [key]: values })
                  }
                  placeholder={`Seleccionar ${key}`}
                />
              );
            } else if (isDropdown[key]) {
              // Checkbox para booleanos como "is_admin"
              return (
                <Select
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  placeholder={`Seleccionar ${key}`}
                  data={multiData[key]}
                  value={formState[key] || ""}
                  onChange={(value) =>
                    setFormState({
                      ...formState,
                      [key]: value,
                    })
                  }
                />
              );
            } else if (typeof initialFormState[key] === "boolean") {
              // Checkbox para booleanos como "is_admin"
              return (
                <Checkbox
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  checked={formState[key]}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      [key]: e.currentTarget.checked,
                    })
                  }
                />
              );
            } else {
              // Input regular para texto
              return (
                <TextInput
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  placeholder={key}
                  value={formState[key] || ""}
                  onChange={(e) =>
                    setFormState({ ...formState, [key]: e.target.value })
                  }
                />
              );
            }
          })}
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
};

export default GenericListPage;
