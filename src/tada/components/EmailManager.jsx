"use client";

import { useState } from "react";
import { TextInput, Button, Textarea, Group, ActionIcon } from "@mantine/core";
import { RiDeleteBin6Line } from "react-icons/ri";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function EmailManager({
  emails,
  setEmails,
  onError,
  onSuccess,
}) {
  const [emailInput, setEmailInput] = useState("");

  const validDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "live.com",
    "aol.com",
    "protonmail.com",
  ];

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split("@")[1];

    return (
      validDomains.includes(domain) ||
      /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)
    );
  };

  const addEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();

    // Validar que no esté vacío
    if (!trimmedEmail) {
      onError("Por favor, ingrese un email");
      return;
    }

    // Validar formato del email
    if (!isValidEmail(trimmedEmail)) {
      onError("El email ingresado no es válido");
      return;
    }

    // Validar que no esté duplicado
    if (emails.includes(trimmedEmail)) {
      onError("Este email ya está en la lista");
      return;
    }

    // Si todas las validaciones pasan, agregar el email
    setEmails([...emails, trimmedEmail]);
    setEmailInput("");
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const emailsFromExcel = [];
        jsonData.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              if (
                typeof cell === "string" &&
                isValidEmail(cell.trim().toLowerCase())
              ) {
                const email = cell.trim().toLowerCase();
                if (!emailsFromExcel.includes(email)) {
                  emailsFromExcel.push(email);
                }
              }
            });
          }
        });

        const newEmails = emailsFromExcel.filter(
          (email) => !emails.includes(email)
        );
        setEmails([...emails, ...newEmails]);
        onSuccess(
          `Se agregaron ${newEmails.length} emails válidos de ${emailsFromExcel.length} encontrados`
        );
      } catch (error) {
        onError("Error al procesar el archivo Excel");
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset the file input
    event.target.value = "";
  };

  const downloadTemplate = () => {
    const templateData = [
      ["email"],
      ["ejemplo1@gmail.com"],
      ["ejemplo2@hotmail.com"],
      ["ejemplo3@outlook.com"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Emails");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "plantilla_emails.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Input para agregar email individual */}
      <div>
        <div className="flex flex-row gap-2 content-baseline items-end">
          <TextInput
            label="Agregar Email"
            placeholder="Ingrese un email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value.toLowerCase())}
            error={
              !isValidEmail(emailInput) && emailInput !== ""
                ? "Email inválido"
                : undefined
            }
            className="w-full"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addEmail();
              }
            }}
          />
          <Button onClick={addEmail} className="w-auto px-6">
            +
          </Button>
        </div>
      </div>

      {/* Botones para cargar Excel y descargar plantilla */}
      <div>
        <Group>
          <Button component="label" variant="outline">
            Cargar Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            Descargar Plantilla
          </Button>
        </Group>
      </div>

      {/* Lista de emails agregados */}
      {emails.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emails agregados ({emails.length}):
          </label>

          {/* Lista individual de emails con botón de eliminar */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 bg-white rounded-md p-2 mb-2">
            {emails.map((email, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-1 px-2 my-3 gap-2 bg-gray-100 hover:bg-gray-50 rounded"
              >
                <span className="text-sm text-black">{email}</span>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={() => removeEmail(email)}
                  title="Eliminar email"
                >
                  <RiDeleteBin6Line size={12} />
                </ActionIcon>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            color="red"
            size="sm"
            onClick={() => setEmails([])}
          >
            Limpiar todos los emails
          </Button>
        </div>
      )}
    </div>
  );
}
