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
} from "@mantine/core";
import { RiEdit2Line, RiAddLine, RiDeleteBin6Line } from "react-icons/ri";

export default function MessagePage() {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<SingleMessage[]>([]);
  const [newMessage, setNewMessage] = useState<Message>({
    notification_type: "",
    name: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchMessages();
    }
  }, [accessToken, page]);

  const fetchMessages = async () => {
    try {
      const data = await listMessages(accessToken, page);
      setMessages(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los mensajes");
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configurar Mensajes</h1>

      <div className="flex justify-end">
        <Button
          onClick={() => setModalOpen(true)}
          leftSection={<RiAddLine />}
          className="mb-4 btn btn-info btn-sm"
        >
          Nuevo Mensaje
        </Button>
      </div>

      {error && (
        <Notification color="red" className="mb-4">
          {error}
        </Notification>
      )}

      <div className="rounded-md">
        <Table className="table table-zebra">
          <thead className="bg-info text-white text-md uppercase font-bold">
            <tr>
              <th>Nombre</th>
              <th>Mensaje</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
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
                    leftSection={<RiEdit2Line />}
                  >
                    Editar
                  </Button>
                  <Button
                    className="btn btn-error btn-sm text-white"
                    onClick={() => handleDelete(msg.id)}
                    leftSection={<RiDeleteBin6Line />}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Pagination
        value={page}
        onChange={(newPage) => setPage(newPage)}
        total={totalPages}
        className="mt-6"
      />

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Mensaje" : "Nuevo Mensaje"}
        centered
      >
        <div className="space-y-4">
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
