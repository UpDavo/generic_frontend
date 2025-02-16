"use client";

import { useEffect, useState } from "react";
import {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from "@/services/pushApi";
import { useAuth } from "@/hooks/useAuth";
import { Message, SingleMessage } from "@/interfaces/message";
import {
  Table,
  Button,
  TextInput,
  Notification,
  Pagination,
  Modal,
  Loader,
} from "@mantine/core";
import {
  RiEdit2Line,
  RiAddLine,
  RiDeleteBin6Line,
  RiSearchLine,
} from "react-icons/ri";

export default function MessagePage() {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<SingleMessage[]>([]);
  const [newMessage, setNewMessage] = useState<Message>({
    notification_type: "",
    name: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Nueva variable para la búsqueda

  useEffect(() => {
    if (accessToken) {
      const delaySearch = setTimeout(() => {
        fetchMessages();
      }, 500); // Retrasa la búsqueda para optimizar solicitudes

      return () => clearTimeout(delaySearch);
    }
  }, [accessToken, page, searchQuery]); // Disparar búsqueda cuando cambia el query o la página

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await listMessages(accessToken, page, searchQuery);
      setMessages(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los mensajes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMessage(id, accessToken);
      fetchMessages();
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al eliminar el mensaje");
    }
  };

  const handleSave = async () => {
    if (!newMessage.name || !newMessage.message) return;
    try {
      if (editingId) {
        await updateMessage(editingId, newMessage, accessToken);
      } else {
        await createMessage(newMessage, accessToken);
      }
      fetchMessages();
      setNewMessage({ notification_type: "", name: "", message: "" });
      setModalOpen(false);
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al guardar el mensaje");
    }
  };

  return (
    <div>
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
            setNewMessage({ notification_type: "", name: "", message: "" });
            setEditingId(null);
            setModalOpen(true);
          }}
          leftSection={<RiAddLine />}
          className="btn btn-info btn-sm"
        >
          Nuevo Mensaje
        </Button>
      </div>

      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto rounded-md">
            <Table className="table">
              <thead className="bg-info text-white text-md uppercase font-bold">
                <tr>
                  <th>Nombre</th>
                  <th>Mensaje</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      <Loader size="sm" color="blue" />
                      <p className="mt-2 text-gray-500">Cargando...</p>
                    </td>
                  </tr>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="hover:bg-slate-200 hover:border-slate-200"
                    >
                      <td className="uppercase font-bold">{msg.name}</td>
                      <td>{msg.message}</td>
                      <td className="flex gap-2">
                        <Button
                          className="btn btn-info btn-sm"
                          onClick={() => {
                            setNewMessage(msg);
                            setEditingId(msg.id);
                            setModalOpen(true);
                          }}
                        >
                          <RiEdit2Line />
                        </Button>
                        <Button
                          className="btn btn-error btn-sm text-white"
                          onClick={() => handleDelete(msg.id)}
                        >
                          <RiDeleteBin6Line />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">
                      No se encontraron mensajes.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
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
        title={editingId ? "Editar Mensaje" : "Nuevo Mensaje"}
        centered
      >
        <div className="space-y-4">
          {editingId === null && (
            <TextInput
              label="Tipo de notificación"
              placeholder="Tipo de notificación"
              value={newMessage.notification_type}
              onChange={(e) =>
                setNewMessage({
                  ...newMessage,
                  notification_type: e.target.value,
                })
              }
            />
          )}

          <TextInput
            label="Nombre"
            placeholder="Nombre"
            value={newMessage.name}
            onChange={(e) =>
              setNewMessage({ ...newMessage, name: e.target.value })
            }
          />
          <TextInput
            label="Mensaje"
            placeholder="Mensaje"
            value={newMessage.message}
            onChange={(e) =>
              setNewMessage({ ...newMessage, message: e.target.value })
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
