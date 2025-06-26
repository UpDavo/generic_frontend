"use client";

import {
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/services/roleApi";
import GenericListPage from "@/components/GenericListPage";

export default function PermissionPage() {
  return (
    <GenericListPage
      title="Permisos"
      fetchFunction={listPermissions}
      createFunction={createPermission}
      updateFunction={updatePermission}
      deleteFunction={deletePermission}
      columns={[
        { key: "name", title: "Nombre" },
        { key: "path", title: "Ruta" },
        { key: "methods", title: "Métodos" },
      ]}
      initialFormState={{
        name: "",
        path: "",
        methods: ["GET", "POST", "PUT", "DELETE"],
      }}
      isMultiSelectFields={{
        methods: true, // Soporte para múltiples métodos HTTP
      }}
    />
  );
}
