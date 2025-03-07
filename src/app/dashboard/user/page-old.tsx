"use client";

import {
  usersList,
  createUser,
  userUpdate,
  deleteUser,
} from "@/services/userApi";

import { listAllRoles } from "@/services/roleApi";
import { useState, useEffect } from "react";
import GenericListPage from "@/components/GenericListPage";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader } from "@mantine/core";
import { Unauthorized } from "@/components/Unauthorized";

export default function UserPage() {
  const [roles, setRoles] = useState([]);
  const { accessToken, user } = useAuth();

  const router = useRouter();
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

  // Fetch roles al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await listAllRoles(accessToken);
        setRoles(data); // Asignar los roles obtenidos
      } catch (error) {
        console.error("Error al cargar los roles:", error);
      }
    };

    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  // Transformar roles a formato para el Dropdown
  const roleOptions = roles.map((role: any) => ({
    value: role.id.toString(),
    label: role.name,
  }));

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
      title="Usuarios"
      fetchFunction={usersList}
      createFunction={createUser}
      updateFunction={userUpdate}
      deleteFunction={deleteUser}
      columns={[
        { key: "email", title: "Email" },
        { key: "first_name", title: "Nombre" },
        { key: "last_name", title: "Apellido" },
        { key: "phone_number", title: "Teléfono" },
        { key: "role_name", title: "Rol" },
      ]}
      initialFormState={{
        email: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        role: "",
      }}
      isDropdown={{
        role: true,
      }}
      multiData={{
        role: roleOptions,
      }}
    />
  );
}
