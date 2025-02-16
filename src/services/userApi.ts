import API_BASE_URL from "../config/apiConfig";
import { SimpleUser } from "@/interfaces/user";

export const updateUser = async (
  sipleUser: SimpleUser,
  accessToken: string
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
  console.log(returned);
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
