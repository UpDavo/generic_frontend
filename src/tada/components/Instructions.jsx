const Instructions = () => {
  return (
    <div className="text-black p-4 sm:p-6">
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold">
            📌 1. Motorizado en camino 🏍️ (Opcional, decisión del POC)
          </h2>
          <p className="text-sm sm:text-base">
            ✅ Se puede enviar cuando el pedido ha sido recogido y está en ruta.
          </p>
          <p className="text-sm sm:text-base">
            ✅ Cada POC decide si lo envía, ya que conoce mejor a sus clientes.
          </p>
          <div className="bg-white p-3 rounded-md mt-3">
            <p className="text-gray-600 italic text-sm sm:text-base">
              &quot;🚀 ¡Tu pedido ya está en camino! 🍻✨ [Nombre], nuestro
              motorizado está en ruta llevando la magia de Tada hasta tu puerta.
              📦📍 Sigue su ubicación en la app y prepárate para
              recibirlo.&quot;
            </p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold">
            📌 2. Motorizado llegó al punto de entrega 🏡 (Enviar si el cliente
            no responde en los primeros 5 minutos)
          </h2>
          <p className="text-sm sm:text-base">
            ✅ Si al llegar a la dirección el cliente no responde en los
            primeros 5 minutos, el POC debe enviar esta notificación.
          </p>
          <div className="bg-white p-3 rounded-md mt-3">
            <p className="text-gray-600 italic text-sm sm:text-base">
              &quot;📦 ¡Tu pedido ha llegado! 🏡🍻 [Nombre], la magia de Tada ya
              está en tu puerta. Nuestro motorizado te espera para entregarte tu
              pedido. ¡Nos vemos en un segundo!&quot;
            </p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold">
            📌 3. Advertencia de cancelación por falta de respuesta 📞 (Enviar
            si han pasado 10 minutos y el cliente sigue sin responder)
          </h2>
          <p className="text-sm sm:text-base">
            ✅ Si pasan 5 minutos después del mensaje anterior (total 10 min
            desde la llegada) y el cliente aún no responde, el POC debe enviar
            esta notificación.
          </p>
          <div className="bg-white p-3 rounded-md mt-3">
            <p className="text-gray-600 italic text-sm sm:text-base">
              &quot;📦 ¡Tu cerveza está a punto de irse! 🍻✨ [Nombre],
              intentamos contactarte, pero no recibimos respuesta. 😔 Escríbenos
              antes de que el pedido sea cancelado.&quot;
            </p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold">
            📌 4. Pedido cancelado por falta de respuesta ❌ (Enviar si han
            pasado 15 minutos y el cliente sigue sin responder)
          </h2>
          <p className="text-sm sm:text-base">
            ✅ Si pasan otros 5 minutos (total 15 min desde la llegada del
            motorizado) y el cliente sigue sin responder, el POC debe enviar
            esta notificación.
          </p>
          <div className="bg-white p-3 rounded-md mt-3">
            <p className="text-gray-600 italic text-sm sm:text-base">
              &quot;⚠️ Tu pedido ha sido cancelado 🍻❌ [Nombre], intentamos
              comunicarnos contigo, pero no tuvimos respuesta. 😔 Si tienes
              alguna novedad, escríbenos al 099 373 2628.&quot;
            </p>
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-green-800">
            📍 Proceso Completo de Notificaciones y Tiempos
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3 text-sm sm:text-base">
            <li>1️⃣ Motorizado en camino (Opcional, decisión del POC).</li>
            <li>
              2️⃣ Motorizado llegó → Si después de 5 min el cliente no responde,
              enviar notificación.
            </li>
            <li>
              3️⃣ Advertencia de cancelación → Si después de 10 min el cliente
              sigue sin responder, enviar notificación.
            </li>
            <li>
              4️⃣ Pedido cancelado → Si después de 15 min el cliente sigue sin
              responder, enviar notificación.
            </li>
          </ul>
          <div className="mt-4 space-y-2">
            <p className="text-green-800 font-medium text-sm sm:text-base">
              ✅ Los POCs deben enviar manualmente cada notificación según los
              tiempos establecidos.
            </p>
            <p className="text-green-800 font-medium text-sm sm:text-base">
              ✅ El mensaje de &quot;Pedido en camino&quot; es opcional y queda
              a criterio del POC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
