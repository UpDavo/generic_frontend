/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { Modal, Button, TextInput } from "@mantine/core";
import { RiEdit2Line } from "react-icons/ri";
import { userUpdate } from "@/auth/services/userApi";
import { useDispatch } from "react-redux";
import { updateUserState } from "@/auth/redux/authSlice";

export default function ProfilePage() {
  const { user, accessToken } = useAuth();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    role: user?.role?.name || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError("");
    try {
      // Preparar los datos para enviar (sin el rol ya que es solo lectura)
      const userDataToUpdate = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        role: user?.role?.id || null, // Enviar el ID del rol, no el nombre
      };

      const updatedUser = await userUpdate(
        user?.id, // ID del usuario actual
        userDataToUpdate, // Datos actualizados
        accessToken, // Token de acceso
        user?.id // ID del usuario autenticado (para recargar si es necesario)
      );

      if (updatedUser && !updatedUser.error) {
        dispatch(updateUserState(updatedUser));
        setIsEditing(false);
      } else {
        setError("Error al actualizar el perfil");
      }
    } catch (err) {
      setError("Ocurrió un error al actualizar el perfil. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="flex w-full items-center text-black">
      <div className="card w-full bg-base-100 shadow-xl p-6 ">
        <h1 className="text-2xl font-bold text-primary mb-4 ">
          Perfil de Usuario
        </h1>
        <div className="space-y-3 text-neutral ">
          <div className="bg-primary rounded-full w-32 h-32 flex items-center justify-center text-2xl mt-2 mb-8 font-bold text-white uppercase">
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
            <strong>Rol:</strong> {user?.role?.name || "No asignado"}
          </p>
        </div>

        {/* <Button
          className="mt-4 w-full btn btn-info"
          onClick={() => setIsEditing(true)}
        >
          <RiEdit2Line /> Editar Perfil
        </Button> */}
      </div>

      <Modal
        opened={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Perfil"
        centered
        className="text-black"
      >
        <div className="space-y-4 text-black">
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
        <div className="mt-8">
          <Button
            onClick={handleSave}
            className="btn btn-info text-white btn-block"
          >
            Guardar Cambios
          </Button>
        </div>
      </Modal>
    </div>
  );
}
