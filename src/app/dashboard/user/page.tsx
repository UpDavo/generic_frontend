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

export default function UserPage() {
  const [roles, setRoles] = useState([]); // Inicializar como array vacío
  const { accessToken, user } = useAuth();

  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const hasPermission =
      user?.role?.is_admin ||
      user?.role?.permissions?.some((perm) => perm.path === "/push");

    // console.log(user?.role?.permissions);

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
