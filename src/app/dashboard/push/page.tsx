"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from "@/services/pushApi";
import GenericListPage from "@/components/GenericListPage";
import { Loader } from "@mantine/core";
import { useAuth } from "@/hooks/useAuth";

export default function MessagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === "/push");

    if (hasPermission) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [user, router]);

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
    <GenericListPage
      title="Mensaje"
      fetchFunction={listMessages}
      createFunction={createMessage}
      updateFunction={updateMessage}
      deleteFunction={deleteMessage}
      columns={[
        { key: "name", title: "Nombre" },
        { key: "message", title: "Mensaje" },
      ]}
      initialFormState={{ notification_type: "", name: "", message: "" }}
    />
  );
}
