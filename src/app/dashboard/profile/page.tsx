/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Modal, Button, TextInput } from "@mantine/core";
import { RiEdit2Line } from "react-icons/ri";
import { updateUser } from "@/services/userApi";
import { useDispatch, useSelector } from "react-redux";
import { updateUserState } from "@/features/auth/authSlice";

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    role: user?.role?.id || 1,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // setError("");
    // try {
    //   const updatedUser = await updateUser(formData);
    //   if (updatedUser && !updatedUser.error) {
    //     dispatch(updateUserState(updatedUser)); // Solo actualiza el usuario sin tocar los tokens
    //     setIsEditing(false);
    //   } else {
    //     setError("Error al actualizar el perfil");
    //   }
    // } catch (err) {
    //   setError("Ocurrió un error al actualizar el perfil. Inténtalo de nuevo.");
    // }
  };

  return (
    <div className="flex w-full items-center">
      <div className="card w-full bg-base-100 shadow-xl p-6">
        <h1 className="text-2xl font-bold text-primary mb-4">
          Perfil de Usuario
        </h1>
        <div className="space-y-3 text-neutral">
          <div className="bg-info rounded-full w-32 h-32 flex items-center justify-center text-2xl mt-2 mb-8 font-bold text-white uppercase">
            {user?.first_name?.charAt(0) || "U"}
          </div>
          <p>
            <strong>Nombre:</strong> {user?.first_name} {user?.last_name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Teléfono:</strong> {user?.phone_number || "No disponible"}
          </p>
          <p>
            <strong>Rol:</strong> {user?.role?.name}
          </p>
        </div>

        <Button
          className="mt-4 w-full btn btn-info"
          onClick={() => setIsEditing(true)}
        >
          <RiEdit2Line /> Editar Perfil
        </Button>
      </div>

      <Modal
        opened={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Perfil"
        centered
      >
        <div className="space-y-4">
          <TextInput
            label="Nombre"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
          <TextInput
            label="Apellido"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
          <TextInput
            label="Email"
            name="email"
            value={formData.email}
            disabled
          />
          <TextInput
            label="Teléfono"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
          <TextInput
            label="Rol"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="mt-8 flex justify-end gap-2">
          <Button className="btn btn-info" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="btn btn-info text-white">
            Guardar Cambios
          </Button>
        </div>
      </Modal>
    </div>
  );
}
