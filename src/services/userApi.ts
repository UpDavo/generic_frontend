import { useAuth } from "@/hooks/useAuth";
import API_BASE_URL from "../config/apiConfig";
import { SimpleUser, User } from "@/interfaces/user";

export const updateUser = async (
  sipleUser: SimpleUser,
  accessToken: string | null
) => {
  console.log(sipleUser);
  const response = await fetch(`${API_BASE_URL}/auth/user/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(sipleUser),
  });

  const returned = await response.json();
  // console.log(returned);
  return returned;
};

export const listUsers = async (accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/users/all/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const returned = await response.json();
  return returned;
};

// Listar usuarios con paginación y filtro opcional por nombre
export const usersList = async (
  accessToken: string | null,
  page: number = 1,
  name: string | null = null
) => {
  const params = new URLSearchParams({ page: page.toString() });

  if (name) {
    params.append("email", name);
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/users-list/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los usuarios");
  }

  const result = await response.json();

  return result;
};

// Crear un nuevo usuario
export const createUser = async (user: User, accessToken: string | null) => {
  const user_data = {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number,
    role: parseInt(user.role),
  };

  const response = await fetch(`${API_BASE_URL}/auth/users-list/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(user_data),
  });

  if (!response.ok) {
    throw new Error("Error al crear el usuario");
  }

  return await response.json();
};

// Obtener detalles de un usuario por ID
export const getUser = async (id: number, accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/users-list/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener el usuario");
  }

  return await response.json();
};

// Actualizar un usuario por ID
export const userUpdate = async (
  id: number,
  sendUser: User,
  accessToken: string | null,
  authUserId: number // Nuevo parámetro
) => {
  const user_data = {
    email: sendUser.email,
    first_name: sendUser.first_name,
    last_name: sendUser.last_name,
    phone_number: sendUser.phone_number,
    role: parseInt(sendUser.role),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/users-list/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(user_data),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar el usuario");
    }

    // ✅ Recarga solo si el usuario autenticado es el mismo que el actualizado
    if (id === authUserId) {
      window.location.reload();
    }

    return await response.json();
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    throw error;
  }
};

// Eliminar un usuario por ID
export const deleteUser = async (id: number, accessToken: string | null) => {
  const response = await fetch(`${API_BASE_URL}/auth/users-list/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el usuario");
  }

  return "OK";
};
