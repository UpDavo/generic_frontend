import API_BASE_URL from "@/config/apiConfig";
import { Role } from "@/core/interfaces/role";
import { Permission } from "@/core/interfaces/permission";

/* =========================
   ==== ROLES FUNCTIONS ====
   ========================= */

// Listar roles con paginación
export const listRoles = async (
  accessToken: string | null,
  page: number = 1,
  search: string = ""
) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", page.toString());
  if (search) {
    searchParams.append("search", search);
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/roles/?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los roles");
  }

  return await response.json();
};

export const listAllRoles = async (accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/roles-all/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los roles");
  }

  return await response.json();
};

// Crear un nuevo rol
export const createRole = async (role: Role, accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/roles/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(role),
  });

  if (!response.ok) {
    throw new Error("Error al crear el rol");
  }

  return await response.json();
};

// Obtener detalles de un rol por ID
export const getRole = async (id: number, accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/roles/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener el rol");
  }

  return await response.json();
};

// Actualizar un rol por ID
export const updateRole = async (
  id: number,
  role: Role,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/auth/roles/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(role),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar el rol");
  }

  return await response.json();
};

// Eliminar un rol por ID
export const deleteRole = async (id: number, accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/roles/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el rol");
  }

  return "OK";
};

/* ================================
   ==== PERMISSIONS FUNCTIONS ====
   ================================ */

// Listar permisos
export const listPermissions = async (
  accessToken: string | null,
  page: number = 1,
  search: string = ""
) => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", page.toString());
  if (search) {
    searchParams.append("search", search);
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/permissions/?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los permisos");
  }

  return await response.json();
};

// Listar todos los permisos sin paginación
export const listAllPermissions = async (accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/permissions-all/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los permisos");
  }

  return await response.json();
};

// Crear un nuevo permiso
export const createPermission = async (
  permission: Permission,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/auth/permissions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(permission),
  });

  if (!response.ok) {
    throw new Error("Error al crear el permiso");
  }

  return await response.json();
};

// Obtener detalles de un permiso por ID
export const getPermission = async (id: number, accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/permissions/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener el permiso");
  }

  return await response.json();
};

// Actualizar un permiso por ID
export const updatePermission = async (
  id: number,
  permission: Permission,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/auth/permissions/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(permission),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar el permiso");
  }

  return await response.json();
};

// Eliminar un permiso por ID
export const deletePermission = async (
  id: number,
  accessToken: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/auth/permissions/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el permiso");
  }

  return "OK";
};
