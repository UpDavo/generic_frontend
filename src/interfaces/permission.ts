export interface Method {
  id: number;
  name: "GET" | "POST" | "PUT" | "DELETE";
}

export interface Permission {
  id?: number;
  name: string;
  path: string;
  methods: number[] | Method[]; // Puede ser array de IDs o de objetos completos
  description?: string;
}
