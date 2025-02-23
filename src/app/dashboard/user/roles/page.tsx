"use client";

import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/roleApi";
import GenericListPage from "@/components/GenericListPage";

export default function RolePage() {
  return (
    <GenericListPage
      title="Roles"
      fetchFunction={listRoles}
      createFunction={createRole}
      updateFunction={updateRole}
      deleteFunction={deleteRole}
      columns={[
        { key: "name", title: "Nombre" },
        { key: "description", title: "Descripción" },
        { key: "is_admin", title: "Administrador" },
        { key: "permissions", title: "Permisos" },
      ]}
      initialFormState={{
        name: "",
        description: "",
        is_admin: false,
        permissions: [], // IDs de los permisos seleccionados
      }}
      isMultiSelectFields={{
        permissions: true, // Habilitar selección múltiple para permisos
      }}
    />
  );
}
