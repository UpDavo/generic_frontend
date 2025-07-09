"use client";

import { useEffect, useState } from "react";
import { sendMessage } from "@/tada/services/pushApi";
import { listMessages } from "@/tada/services/pushApi";
import { useAuth } from "@/auth/hooks/useAuth";
import { Button, Notification, Loader, Select, Accordion } from "@mantine/core";
import { useRouter } from "next/navigation";
import { Unauthorized } from "@/core/components/Unauthorized";
import Instructions from "@/tada/components/Instructions";
import EmailManager from "@/tada/components/EmailManager";
import { send } from "process";
import SendPush from "@/tada/components/SendPush";

const PERMISSION_PATH = "/push/send";

export default function PushPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
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
    setLoadingMessages(true);
    try {
      const data = await listMessages(accessToken, 1);
      setMessages(data.results);
    } catch (err) {
      console.log(err);
      setError("Error al cargar los mensajes");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!selectedMessage || emails.length === 0) {
      setError("Por favor, seleccione un mensaje y agregue al menos un email");
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
        emails: emails,
        notification_type: messageToSend.notification_type,
      };
      console.log(sendObject);
      await sendMessage(sendObject, accessToken);

      setSuccess(
        `Notificaciones enviadas con éxito a ${emails.length} destinatarios`
      );
      setEmails([]);
      setSelectedMessage(null);
    } catch (err) {
      setError("Error al enviar las notificaciones");
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
        <Accordion.Item value="instructions" className="bg-white">
          <Accordion.Control>
            <span className="font-medium">Mensajes a enviar</span>
          </Accordion.Control>
          <Accordion.Panel className="bg-white rounded-b-lg">
            <Instructions />
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="push" className="bg-white">
          <Accordion.Control>
            <span className="font-medium">Como usar la herramienta</span>
          </Accordion.Control>
          <Accordion.Panel className="bg-white rounded-b-lg">
            <SendPush />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <EmailManager
        emails={emails}
        setEmails={setEmails}
        onError={setError}
        onSuccess={setSuccess}
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
        disabled={loadingMessages}
        rightSection={loadingMessages ? <Loader size="sm" /> : null}
        className="text-black my-4"
      />
      <div className="mt-4">
        <Button
          className="btn btn-md"
          fullWidth
          onClick={handleSend}
          disabled={loading || emails.length === 0}
        >
          {loading ? (
            <Loader size="sm" />
          ) : (
            `Enviar Notificaciones (${emails.length})`
          )}
        </Button>
      </div>
    </div>
  );
}
