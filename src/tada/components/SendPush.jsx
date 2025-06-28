const SendPush = () => {
  return (
    <div className="text-black sm:p-6">
      <div className="">
        {/* Nueva sección: Instrucciones para gestión de emails */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-800 mb-3">
            📧 Cómo Gestionar los Correos Electrónicos
          </h2>

          <div className="space-y-4 text-sm sm:text-base">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <h3 className="font-semibold text-blue-700 mb-2">
                ✍️ Agregar Correos Individuales:
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Escribe el email en el campo "Agregar Email"</li>
                <li>
                  Presiona{" "}
                  <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">
                    Enter
                  </kbd>{" "}
                  o haz clic en "Agregar"
                </li>
                <li>
                  El sistema validará automáticamente el formato del email
                </li>
                <li>No se permitirán emails duplicados</li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-md shadow-sm">
              <h3 className="font-semibold text-blue-700 mb-2">
                📤 Cargar Emails desde Excel:
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Haz clic en "📤 Cargar Excel" para subir un archivo</li>
                <li>El sistema buscará emails válidos en todas las celdas</li>
                <li>Se agregarán solo los emails nuevos (no duplicados)</li>
                <li>
                  Recibirás un mensaje con la cantidad de emails agregados
                </li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-md shadow-sm">
              <h3 className="font-semibold text-blue-700 mb-2">
                📥 Usar la Plantilla de Excel:
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>
                  Haz clic en "📥 Descargar Plantilla" para obtener un ejemplo
                </li>
                <li>La plantilla incluye ejemplos de emails válidos</li>
                <li>
                  Puedes agregar tus emails en cualquier celda del archivo
                </li>
                <li>Guarda el archivo y súbelo usando "Cargar Excel"</li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-md shadow-sm">
              <h3 className="font-semibold text-blue-700 mb-2">
                🗑️ Gestionar la Lista de Emails:
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>
                  Cada email se muestra con un botón de eliminar individual
                </li>
                <li>Puedes ver el contador total de emails agregados</li>
                <li>
                  Usa "🗑️ Limpiar todos los emails" para borrar toda la lista
                </li>
                <li>La lista es scrolleable si tienes muchos emails</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <p className="text-yellow-800 font-medium">
                💡 <strong>Tip:</strong> Solo se aceptan emails de dominios
                conocidos como Gmail, Hotmail, Outlook, Yahoo, iCloud, etc. El
                sistema validará automáticamente cada email antes de agregarlo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendPush;
