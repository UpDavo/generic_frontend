import html2canvas from "html2canvas";

/**
 * Genera y descarga una imagen de un elemento del DOM
 * @param {HTMLElement} element - Elemento del DOM a capturar
 * @param {Object} options - Opciones de configuración
 * @param {string} options.filename - Nombre del archivo a descargar (sin extensión)
 * @param {number} options.width - Ancho de la imagen (default: 1600)
 * @param {number} options.scale - Escala de la imagen (default: 2)
 * @param {number} options.padding - Padding interno (default: "60px 80px")
 * @param {string} options.sectionId - ID del elemento a capturar (default: "chartSection")
 * @param {string[]} options.hideSelectors - Selectores de elementos a ocultar en la captura
 * @returns {Promise<void>}
 */
export const generateChartImage = async (element, options = {}) => {
    if (!element) {
        throw new Error("No se proporcionó un elemento para capturar");
    }

    const {
        filename = "chart",
        width = 1600,
        scale = 2,
        padding = "60px 80px",
        sectionId = "chartSection",
        hideSelectors = [],
        fontScale = 1,
    } = options;

    // Calcular tamaños de fuente basados en fontScale
    const baseFontSize = Math.round(11 * fontScale);
    const smallFontSize = Math.round(10 * fontScale);
    const cellPadding = fontScale < 1 ? "6px 4px" : "10px 6px";

    // Calcular altura real del contenido
    const elementHeight = Math.max(
        element.scrollHeight,
        element.offsetHeight,
        element.clientHeight,
        1500 // Altura mínima para asegurar que se capture todo
    );

    const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 30000,
        scale: scale,
        width: width,
        windowWidth: width,
        windowHeight: elementHeight + 500,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc, clonedElement) => {
            // Ocultar elementos específicos (como versiones móviles)
            if (hideSelectors && hideSelectors.length > 0) {
                hideSelectors.forEach((selector) => {
                    try {
                        const elements = clonedDoc.querySelectorAll(selector);
                        elements.forEach((el) => {
                            el.style.display = "none";
                        });
                    } catch (e) {
                        // Selector inválido, ignorar
                    }
                });
                
                // También ocultar elementos con clases que contengan "md:hidden" o "block md:hidden"
                const allElements = clonedDoc.querySelectorAll("*");
                allElements.forEach((el) => {
                    if (el.className && typeof el.className === "string") {
                        if (el.className.includes("md:hidden") && !el.className.includes("hidden md:block")) {
                            el.style.display = "none";
                        }
                    }
                });
            }

            // Eliminar TODOS los stylesheets existentes que puedan tener colores modernos
            const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styleSheets.forEach((sheet) => {
                sheet.remove();
            });

            // Agregar un stylesheet completamente nuevo con solo colores RGB
            const style = clonedDoc.createElement("style");
            style.textContent = `
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box !important;
                    color: #000000 !important;
                    border-color: #d1d5db !important;
                }

                body {
                    width: ${width}px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: flex-start !important;
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                }

                #${sectionId} {
                    width: ${width - 100}px !important;
                    max-width: ${width - 100}px !important;
                    margin: 0 auto !important;
                    padding: ${padding} !important;
                    background-color: #ffffff !important;
                    box-sizing: border-box !important;
                    color: #000000 !important;
                    overflow: visible !important;
                    height: auto !important;
                }

                /* Contenedor de la gráfica */
                .recharts-responsive-container {
                    width: 100% !important;
                    max-width: 100% !important;
                    min-height: 400px !important;
                    margin-bottom: 30px !important;
                }

                .recharts-wrapper {
                    background-color: #ffffff !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                .recharts-wrapper svg {
                    width: 100% !important;
                    max-width: 100% !important;
                    overflow: visible !important;
                }
                
                svg {
                    background-color: #ffffff !important;
                    overflow: visible !important;
                    max-width: 100% !important;
                }
                
                svg text {
                    fill: #000000 !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    font-size: 11px !important;
                }
                
                svg line {
                    stroke: #e0e0e0 !important;
                }

                .recharts-cartesian-grid line {
                    stroke: #e0e0e0 !important;
                }

                .recharts-bar-rectangle path {
                    stroke: none !important;
                }

                .recharts-legend-wrapper {
                    padding-top: 20px !important;
                }

                /* Espacio entre gráfica y tabla */
                .space-y-4 > * + * {
                    margin-top: 30px !important;
                }

                /* Tabla */
                .overflow-x-auto {
                    overflow: visible !important;
                    margin-top: 40px !important;
                }

                table { 
                    width: 100% !important; 
                    border-collapse: collapse !important;
                    table-layout: auto !important;
                    background-color: #ffffff !important;
                    margin: 0 auto !important;
                }
                
                th, td { 
                    border: 1px solid #d1d5db !important;
                    padding: ${cellPadding} !important;
                    text-align: center !important;
                    word-wrap: break-word !important;
                    vertical-align: middle !important;
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    font-size: ${baseFontSize}px !important;
                }
                
                thead th {
                    background-color: #f3f4f6 !important;
                    color: #000000 !important;
                    font-weight: bold !important;
                    font-size: ${baseFontSize}px !important;
                }

                /* Primera columna más ancha */
                th:first-child, td:first-child {
                    min-width: ${fontScale < 1 ? '80px' : '120px'} !important;
                    text-align: left !important;
                }

                /* Colores de nivel para tablas jerárquicas */
                .bg-blue-50 { background-color: #eff6ff !important; }
                .bg-blue-100 { background-color: #dbeafe !important; }
                .bg-blue-150 { background-color: #bfdbfe !important; }
                .bg-purple-100 { background-color: #f3e8ff !important; }
                .bg-yellow-100 { background-color: #fef9c3 !important; }

                /* Padding para niveles */
                .pl-4 { padding-left: 16px !important; }
                .pl-8 { padding-left: 32px !important; }
                .pl-12 { padding-left: 48px !important; }
                .pl-16 { padding-left: 64px !important; }

                /* Cards */
                .card {
                    background-color: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    padding: 24px !important;
                    margin-bottom: 24px !important;
                }

                /* Espacio entre tablas */
                .space-y-6 > * + * {
                    margin-top: 24px !important;
                }

                /* Títulos de categorías */
                h2 {
                    background-color: #f3e8ff !important;
                    padding: 12px !important;
                    border-radius: 6px !important;
                    margin-bottom: 12px !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                }

                /* Colores específicos */
                .bg-primary { background-color: #18181b !important; }
                .text-primary { color: #18181b !important; }
                .bg-green-600 { background-color: #16a34a !important; }
                .text-green-600 { color: #16a34a !important; }
                .bg-red-600 { background-color: #dc2626 !important; }
                .text-red-600 { color: #dc2626 !important; }
                .bg-blue-600 { background-color: #2563eb !important; }
                .text-blue-600 { color: #2563eb !important; }
                .bg-purple-600 { background-color: #9333ea !important; }
                .text-purple-600 { color: #9333ea !important; }
                .bg-gray-500 { background-color: #6b7280 !important; }
                .text-gray-500 { color: #6b7280 !important; }
                .bg-gray-200 { background-color: #e5e7eb !important; }
                .text-gray-600 { color: #4b5563 !important; }
                .bg-white { background-color: #ffffff !important; }
                .text-black { color: #000000 !important; }
                .border-gray-200 { border-color: #e5e7eb !important; }
                .border-yellow-300 { border-color: #fcd34d !important; }
                .border-yellow-400 { border-color: #facc15 !important; }

                /* Ocultar elementos móviles */
                .md\\:hidden { display: none !important; }
            `;

            clonedDoc.head.appendChild(style);

            // Forzar estilos inline en todos los elementos
            const allElements = clonedDoc.querySelectorAll("*");
            allElements.forEach((el) => {
                el.style.color = "#000000";
                if (el.tagName !== "SVG" && el.tagName !== "svg" && 
                    !el.closest("svg") && el.tagName !== "path" && el.tagName !== "rect") {
                    el.style.backgroundColor = el.style.backgroundColor || "#ffffff";
                }
            });

            // Configurar la sección del chart
            const section = clonedDoc.querySelector(`#${sectionId}`);
            const contentWidth = width - 160; // Restar padding
            if (section) {
                section.style.maxWidth = `${width - 100}px`;
                section.style.width = `${width - 100}px`;
                section.style.margin = "0 auto";
                section.style.padding = padding;
                section.style.backgroundColor = "#ffffff";
                section.style.overflow = "hidden";
            }

            // Configurar el contenedor responsive de recharts
            const rechartsContainers = clonedDoc.querySelectorAll(".recharts-responsive-container");
            rechartsContainers.forEach((container) => {
                container.style.width = "100%";
                container.style.maxWidth = "100%";
                container.style.minHeight = "400px";
            });

            // Configurar el wrapper de recharts y SVGs
            const rechartsWrappers = clonedDoc.querySelectorAll(".recharts-wrapper");
            rechartsWrappers.forEach((wrapper) => {
                wrapper.style.width = "100%";
                wrapper.style.maxWidth = `${contentWidth}px`;
                
                const svg = wrapper.querySelector("svg");
                if (svg) {
                    svg.setAttribute("width", "100%");
                    svg.style.width = "100%";
                    svg.style.maxWidth = "100%";
                }
            });

            // Configurar tablas
            const tables = clonedDoc.querySelectorAll("table");
            tables.forEach((table) => {
                table.style.display = "table";
                table.style.width = "100%";
                table.style.maxWidth = "100%";
                table.style.borderCollapse = "collapse";
                table.style.backgroundColor = "#ffffff";
                table.style.marginTop = "40px";
                table.style.tableLayout = "fixed";

                const rows = table.querySelectorAll("tr");
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll("th, td");
                    cells.forEach((cell) => {
                        cell.style.padding = "10px 6px";
                        cell.style.border = "1px solid #d1d5db";
                        cell.style.textAlign = "center";
                        cell.style.color = "#000000";
                        cell.style.fontSize = "11px";
                    });
                });
            });
        },
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Error al generar la imagen"));
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;

                const now = new Date();
                const dateStr = now.toISOString().split("T")[0];
                const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");

                link.download = `${filename}_${dateStr}_${timeStr}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                resolve();
            },
            "image/jpeg",
            0.95
        );
    });
};

/**
 * Genera una imagen en base64 de un elemento del DOM (sin descargar)
 * @param {HTMLElement} element - Elemento del DOM a capturar
 * @param {Object} options - Opciones de configuración (mismas que generateChartImage)
 * @returns {Promise<string>} - Imagen en formato base64 (data:image/png;base64,...)
 */
export const generateChartImageBase64 = async (element, options = {}) => {
    if (!element) {
        throw new Error("No se proporcionó un elemento para capturar");
    }

    const {
        width = 1600,
        scale = 2,
        padding = "60px 80px",
        sectionId = "chartSection",
        hideSelectors = [],
        fontScale = 1,
    } = options;

    // Calcular tamaños de fuente basados en fontScale
    const baseFontSize = Math.round(11 * fontScale);
    const smallFontSize = Math.round(10 * fontScale);
    const cellPadding = fontScale < 1 ? "6px 4px" : "10px 6px";

    // Calcular altura real del contenido
    const elementHeight = Math.max(
        element.scrollHeight,
        element.offsetHeight,
        element.clientHeight,
        1500 // Altura mínima para asegurar que se capture todo
    );

    const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 30000,
        scale: scale,
        width: width,
        windowWidth: width,
        windowHeight: elementHeight + 500,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc, clonedElement) => {
            // Ocultar elementos específicos (como versiones móviles o botones)
            if (hideSelectors && hideSelectors.length > 0) {
                hideSelectors.forEach((selector) => {
                    try {
                        const elements = clonedDoc.querySelectorAll(selector);
                        elements.forEach((el) => {
                            el.style.display = "none";
                        });
                    } catch (e) {
                        // Selector inválido, ignorar
                    }
                });
                
                const allElements = clonedDoc.querySelectorAll("*");
                allElements.forEach((el) => {
                    if (el.className && typeof el.className === "string") {
                        if (el.className.includes("md:hidden") && !el.className.includes("hidden md:block")) {
                            el.style.display = "none";
                        }
                    }
                });
            }

            // Eliminar TODOS los stylesheets existentes
            const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styleSheets.forEach((sheet) => {
                sheet.remove();
            });

            // Agregar un stylesheet completo con solo colores RGB (mismo que generateChartImage)
            const style = clonedDoc.createElement("style");
            style.textContent = `
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box !important;
                    color: #000000 !important;
                    border-color: #d1d5db !important;
                }

                body {
                    width: ${width}px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: flex-start !important;
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                }

                #${sectionId} {
                    width: ${width - 100}px !important;
                    max-width: ${width - 100}px !important;
                    margin: 0 auto !important;
                    padding: ${padding} !important;
                    background-color: #ffffff !important;
                    box-sizing: border-box !important;
                    color: #000000 !important;
                    overflow: visible !important;
                    height: auto !important;
                }

                /* Contenedor de la gráfica */
                .recharts-responsive-container {
                    width: 100% !important;
                    max-width: 100% !important;
                    min-height: 400px !important;
                    margin-bottom: 30px !important;
                }

                .recharts-wrapper {
                    background-color: #ffffff !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                .recharts-wrapper svg {
                    width: 100% !important;
                    max-width: 100% !important;
                    overflow: visible !important;
                }
                
                svg {
                    background-color: #ffffff !important;
                    overflow: visible !important;
                    max-width: 100% !important;
                }
                
                svg text {
                    fill: #000000 !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    font-size: 11px !important;
                }
                
                svg line {
                    stroke: #e0e0e0 !important;
                }

                .recharts-cartesian-grid line {
                    stroke: #e0e0e0 !important;
                }

                .recharts-bar-rectangle path {
                    stroke: none !important;
                }

                .recharts-legend-wrapper {
                    padding-top: 20px !important;
                }

                /* Espacio entre gráfica y tabla */
                .space-y-4 > * + * {
                    margin-top: 30px !important;
                }

                /* Tabla */
                .overflow-x-auto {
                    overflow: visible !important;
                    margin-top: 40px !important;
                }

                table { 
                    width: 100% !important; 
                    border-collapse: collapse !important;
                    table-layout: fixed !important;
                    background-color: #ffffff !important;
                    margin: 0 auto !important;
                    max-width: 100% !important;
                }
                
                th, td { 
                    border: 1px solid #d1d5db !important;
                    padding: ${cellPadding} !important;
                    text-align: center !important;
                    word-wrap: break-word !important;
                    vertical-align: middle !important;
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    font-size: ${baseFontSize}px !important;
                }
                
                thead th {
                    background-color: #f3f4f6 !important;
                    color: #000000 !important;
                    font-weight: bold !important;
                    font-size: ${baseFontSize}px !important;
                }

                /* Primera columna más ancha */
                th:first-child, td:first-child {
                    min-width: ${fontScale < 1 ? '80px' : '120px'} !important;
                    text-align: left !important;
                }

                /* Colores de nivel para tablas jerárquicas */
                .bg-blue-50 { background-color: #eff6ff !important; }
                .bg-blue-100 { background-color: #dbeafe !important; }
                .bg-blue-150 { background-color: #bfdbfe !important; }
                .bg-purple-50 { background-color: #faf5ff !important; }
                .bg-purple-100 { background-color: #f3e8ff !important; }
                .bg-yellow-100 { background-color: #fef9c3 !important; }
                .bg-gray-50 { background-color: #f9fafb !important; }
                .bg-gray-100 { background-color: #f3f4f6 !important; }

                /* Padding para niveles */
                .pl-4 { padding-left: 16px !important; }
                .pl-8 { padding-left: 32px !important; }
                .pl-12 { padding-left: 48px !important; }
                .pl-16 { padding-left: 64px !important; }

                /* Espacio entre tablas */
                .space-y-6 > * + * {
                    margin-top: 24px !important;
                }

                /* Títulos de categorías */
                h2 {
                    background-color: #f3e8ff !important;
                    padding: 12px !important;
                    border-radius: 6px !important;
                    margin-bottom: 12px !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                }

                /* Colores específicos */
                .bg-primary { background-color: #18181b !important; }
                .text-primary { color: #18181b !important; }
                .bg-green-600 { background-color: #16a34a !important; }
                .text-green-600 { color: #16a34a !important; }
                .bg-red-600 { background-color: #dc2626 !important; }
                .text-red-600 { color: #dc2626 !important; }
                .bg-blue-600 { background-color: #2563eb !important; }
                .text-blue-600 { color: #2563eb !important; }
                .bg-purple-600 { background-color: #9333ea !important; }
                .text-purple-600 { color: #9333ea !important; }
                .bg-gray-500 { background-color: #6b7280 !important; }
                .text-gray-500 { color: #6b7280 !important; }
                .bg-gray-200 { background-color: #e5e7eb !important; }
                .text-gray-600 { color: #4b5563 !important; }
                .bg-white { background-color: #ffffff !important; }
                .text-black { color: #000000 !important; }
                .border-gray-200 { border-color: #e5e7eb !important; }
                .border-gray-300 { border-color: #d1d5db !important; }
                .border-yellow-300 { border-color: #fcd34d !important; }
                .border-yellow-400 { border-color: #facc15 !important; }

                /* Ocultar elementos móviles */
                .md\\:hidden { display: none !important; }
            `;
            clonedDoc.head.appendChild(style);

            // Forzar estilos inline en todos los elementos
            const allElements = clonedDoc.querySelectorAll("*");
            allElements.forEach((el) => {
                el.style.color = "#000000";
                if (el.tagName !== "SVG" && el.tagName !== "svg" && 
                    !el.closest("svg") && el.tagName !== "path" && el.tagName !== "rect") {
                    el.style.backgroundColor = el.style.backgroundColor || "#ffffff";
                }
            });

            // Configurar la sección del chart
            const section = clonedDoc.querySelector(`#${sectionId}`);
            const contentWidth = width - 160;
            if (section) {
                section.style.maxWidth = `${width - 100}px`;
                section.style.width = `${width - 100}px`;
                section.style.margin = "0 auto";
                section.style.padding = padding;
                section.style.backgroundColor = "#ffffff";
                section.style.overflow = "hidden";
            }

            // Configurar el contenedor responsive de recharts
            const rechartsContainers = clonedDoc.querySelectorAll(".recharts-responsive-container");
            rechartsContainers.forEach((container) => {
                container.style.width = "100%";
                container.style.maxWidth = "100%";
                container.style.minHeight = "400px";
            });

            // Configurar el wrapper de recharts y SVGs
            const rechartsWrappers = clonedDoc.querySelectorAll(".recharts-wrapper");
            rechartsWrappers.forEach((wrapper) => {
                wrapper.style.width = "100%";
                wrapper.style.maxWidth = `${contentWidth}px`;
                
                const svg = wrapper.querySelector("svg");
                if (svg) {
                    svg.setAttribute("width", "100%");
                    svg.style.width = "100%";
                    svg.style.maxWidth = "100%";
                }
            });

            // Configurar tablas
            const tables = clonedDoc.querySelectorAll("table");
            tables.forEach((table) => {
                table.style.display = "table";
                table.style.width = "100%";
                table.style.maxWidth = "100%";
                table.style.borderCollapse = "collapse";
                table.style.backgroundColor = "#ffffff";
                table.style.marginTop = "40px";
                table.style.tableLayout = "fixed";

                const rows = table.querySelectorAll("tr");
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll("th, td");
                    cells.forEach((cell) => {
                        cell.style.padding = "10px 6px";
                        cell.style.border = "1px solid #d1d5db";
                        cell.style.textAlign = "center";
                        cell.style.color = "#000000";
                        cell.style.fontSize = "11px";
                    });
                });
            });
        },
    });

    return canvas.toDataURL("image/png", 1.0);
};

/**
 * Genera el nombre del archivo para reportes de hectolitros
 * @param {Object} filters - Filtros aplicados
 * @param {number} filters.startWeek - Semana inicial
 * @param {number} filters.endWeek - Semana final
 * @param {number} filters.startYear - Año inicial
 * @param {number} filters.endYear - Año final
 * @returns {string} - Nombre del archivo
 */
export const generateHectolitrosFilename = (filters) => {
    const {
        startWeek,
        endWeek,
        startYear,
        endYear,
        startDate,
        endDate,
    } = filters || {};

    if (!startWeek || !endWeek || !startYear || !endYear) {
        if (startDate && endDate) {
            const safeStart = String(startDate).replace(/-/g, "");
            const safeEnd = String(endDate).replace(/-/g, "");
            return `hectolitros_${safeStart}_${safeEnd}`;
        }
        return "hectolitros";
    }

    const weekRange = `S${startWeek}-${endWeek}`;
    const yearRange = startYear !== endYear
        ? `${startYear}-${endYear}`
        : `${startYear}`;

    return `hectolitros_${weekRange}_${yearRange}`;
};

/**
 * Genera el nombre del archivo para reportes de tráfico
 * @param {Object} params - Parámetros del reporte
 * @param {string} params.dayName - Nombre del día
 * @param {number} params.startWeek - Semana inicial
 * @param {number} params.endWeek - Semana final
 * @param {number} params.startYear - Año inicial
 * @param {number} params.endYear - Año final
 * @returns {string} - Nombre del archivo
 */
export const generateTrafficFilename = (params) => {
    const { dayName, startWeek, endWeek, startYear, endYear } = params;
    const weekRange = startWeek && endWeek ? `_S${startWeek}-${endWeek}` : "";
    const yearRange = startYear && endYear && startYear !== endYear 
        ? `_${startYear}-${endYear}` 
        : `_${endYear || startYear}`;
    
    return `reporte-trafico-${dayName}${weekRange}${yearRange}`;
};

/**
 * Genera el nombre del archivo para reportes de Top SKUs
 * @param {Object} filters - Filtros aplicados
 * @param {number} filters.startWeek - Semana inicial
 * @param {number} filters.endWeek - Semana final
 * @param {number} filters.startYear - Año inicial
 * @param {number} filters.endYear - Año final
 * @param {string} filters.reportType - Tipo de reporte (hectolitros, caja)
 * @param {string} filters.productCategory - Categoría de producto
 * @returns {string} - Nombre del archivo
 */
export const generateTopSkusFilename = (filters) => {
    const { startWeek, endWeek, startYear, endYear, reportType, productCategory } = filters;
    const weekRange = `S${startWeek}-${endWeek}`;
    const yearRange = startYear !== endYear 
        ? `${startYear}-${endYear}` 
        : `${startYear}`;
    const category = productCategory ? `_${productCategory}` : "";
    
    return `top_skus_${reportType}${category}_${weekRange}_${yearRange}`;
};

/**
 * Genera el nombre del archivo para reportes de Comparación Anual
 * @param {Object} filters - Filtros aplicados
 * @param {number} filters.startWeek - Semana inicial
 * @param {number} filters.endWeek - Semana final
 * @param {number} filters.startYear - Año inicial
 * @param {number} filters.endYear - Año final
 * @param {string} filters.reportType - Tipo de reporte (hectolitros, caja)
 * @returns {string} - Nombre del archivo
 */
export const generateComparacionAnualFilename = (filters) => {
    const { startWeek, endWeek, startYear, endYear, reportType } = filters;
    const weekRange = `S${startWeek}-${endWeek}`;
    const yearRange = startYear !== endYear 
        ? `${startYear}-${endYear}` 
        : `${startYear}`;
    
    return `comparacion_anual_${reportType}_${weekRange}_${yearRange}`;
};
