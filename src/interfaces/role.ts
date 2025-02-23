import { Permission } from "./permission";

export interface Role {
  id?: number;
  name: string;
  description?: string;
  permissions: number[] | Permission[]; // Puede ser array de IDs o de objetos completos
  is_admin?: boolean;
}
