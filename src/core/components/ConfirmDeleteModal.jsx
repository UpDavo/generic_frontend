"use client";

import { Modal, Button, Loader } from "@mantine/core";

export default function ConfirmDeleteModal({
  opened,
  onClose,
  onConfirm,
  itemName,
  loading = false,
}) {
  return (
    <Modal
      opened={opened}
      onClose={() => !loading && onClose()} // Evitar cerrar si está en proceso
      title="Confirmar eliminación"
      className="text-black"
      centered
    >
      <div className="space-y-4 text-black">
        <p className="text-gray-700">
          ¿Estás seguro que deseas eliminar{" "}
          {itemName ? <strong>{itemName}</strong> : "este registro"}? Esta
          acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button color="red" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader size="xs" color="white" /> : "Eliminar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
