export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  is_verified: boolean;
  role: {
    id: number;
    name: string;
    description: string;
    permissions: { id: number; name: string; path: string }[];
    is_admin: boolean;
  } | null;
}

export interface SimpleUser {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  role: number | null
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}


