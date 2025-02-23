"use client";

import { useEffect, useState } from "react";
import { sendMessage } from "@/services/pushApi";
import { listMessages } from "@/services/pushApi";
import { useAuth } from "@/hooks/useAuth";
import { SingleMessage } from "@/interfaces/message";
import {
  TextInput,
  Button,
  Notification,
  Loader,
  MultiSelect,
} from "@mantine/core";
import { useRouter } from "next/navigation";

export default function PushPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState<SingleMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === "/push/send");

    // console.log(user?.role?.permissions);

    if (hasPermission) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (accessToken) {
      fetchMessages();
    }
  }, [accessToken]);

  const fetchMessages = async () => {
    try {
      const data = await listMessages(accessToken, 1);
      setMessages(data.results);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los mensajes");
    }
  };

  const handleSend = async () => {
    if (!selectedMessage || !email) {
      setError("Por favor, seleccione un mensaje y escriba un email");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const messageToSend = messages.find(
        (msg) => msg.id.toString() === selectedMessage
      );
      if (!messageToSend) {
        setError("Mensaje seleccionado no válido");
        setLoading(false);
        return;
      }

      const sendObject = {
        email,
        notification_type: messageToSend.notification_type,
      };

      await sendMessage(sendObject, accessToken);
      setSuccess("Notificación enviada con éxito");
      setEmail("");
      setSelectedMessage(null);
    } catch (err) {
      console.log(err);
      setError("Error al enviar la notificación");
    } finally {
      setLoading(false);
    }
  };

  if (authorized === null) {
    return (
      <div className="flex justify-center items-center mt-64">
        <Loader size="lg" />
      </div>
    );
  }

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
      {error && (
        <Notification
          color="red"
          className="mb-4"
          onClose={() => setError(null)}
        >
          {error}
        </Notification>
      )}

      {success && (
        <Notification
          color="green"
          className="mb-4"
          onClose={() => setSuccess(null)}
        >
          {success}
        </Notification>
      )}

      <div className="card bg-base-100 shadow-xl w-full">
        <div className="card-body">
          <TextInput
            label="Email"
            placeholder="Ingrese el email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <MultiSelect
            label="Seleccionar Mensaje"
            placeholder="Busque y seleccione un mensaje"
            data={messages.map((msg) => ({
              value: msg.id.toString(),
              label: msg.name,
            }))}
            searchable
            value={selectedMessage ? [selectedMessage] : []}
            onChange={(values) =>
              setSelectedMessage(values.length > 0 ? values[0] : null)
            }
          />
        </div>
        <div className="card-actions px-8 pb-6">
          <Button
            className="btn btn-info btn-md"
            fullWidth
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? <Loader size="sm" /> : "Enviar Notificación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
