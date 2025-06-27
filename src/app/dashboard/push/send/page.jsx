"use client";

import { useEffect, useState } from "react";
import { sendMessage } from "@/tada/services/pushApi";
import { listMessages } from "@/tada/services/pushApi";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  TextInput,
  Button,
  Notification,
  Loader,
  Select,
  Accordion,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { Unauthorized } from "@/core/components/Unauthorized";
import Instructions from "@/tada/components/Instructions";

const PERMISSION_PATH = "/push/send";

export default function PushPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true); // Estado de carga para los mensajes
  const [authorized, setAuthorized] = useState(null);

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

  useEffect(() => {
    if (accessToken) {
      fetchMessages();
    }
  }, [accessToken]);

  const fetchMessages = async () => {
    setLoadingMessages(true); // Inicia la carga
    try {
      const data = await listMessages(accessToken, 1);
      setMessages(data.results);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los mensajes");
    } finally {
      setLoadingMessages(false); // Finaliza la carga
    }
  };

  const validDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "live.com",
    "aol.com",
    "protonmail.com",
  ];

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split("@")[1];

    return (
      validDomains.includes(domain) ||
      /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)
    );
  };

  const handleSend = async () => {
    if (!selectedMessage || !email) {
      setError("Por favor, seleccione un mensaje y escriba un email");
      return;
    }

    if (!isValidEmail(email)) {
      setError("El email ingresado no es válido");
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
    return <Unauthorized />;
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

      <Accordion variant="contained" className="mb-4">
        <Accordion.Item value="instructions" className="border border-gray-700">
          <Accordion.Control>
            <span className="font-medium">Ver mensajes a enviar</span>
          </Accordion.Control>
          <Accordion.Panel className="bg-white rounded-b-lg">
            <Instructions />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <TextInput
        label="Email"
        placeholder="Ingrese el email"
        value={email}
        onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
        error={
          !isValidEmail(email) && email !== "" ? "Email inválido" : undefined
        }
        className="mb-4 text-black"
      />
      <Select
        label="Seleccionar Mensaje"
        placeholder={
          loadingMessages ? "Cargando mensajes..." : "Seleccione un mensaje"
        }
        data={messages.map((msg) => ({
          value: msg.id.toString(),
          label: msg.name.toUpperCase(),
        }))}
        searchable
        value={selectedMessage}
        onChange={setSelectedMessage}
        disabled={loadingMessages} // Desactiva el dropdown mientras carga
        rightSection={loadingMessages ? <Loader size="sm" /> : null} // Agrega un loader dentro del select
        className="text-black mb-4"
      />
      <div className="mt-4">
        <Button
          className="btn btn-md"
          fullWidth
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? <Loader size="sm" /> : "Enviar Notificación"}
        </Button>
      </div>
    </div>
  );
}
