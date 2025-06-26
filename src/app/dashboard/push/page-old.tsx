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
import { Unauthorized } from "@/components/Unauthorized";

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
    return <Unauthorized />;
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
        { key: "title", title: "Título" },
        { key: "message", title: "Mensaje" },
      ]}
      initialFormState={{
        notification_type: "",
        name: "",
        title: "",
        message: "",
      }}
    />
  );
}
