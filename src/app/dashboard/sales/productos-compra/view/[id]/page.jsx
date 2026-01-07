"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import {
    Button,
    Loader,
    Notification,
    Card,
    Badge,
} from "@mantine/core";
import {
    RiArrowLeftLine,
    RiEditLine,
} from "react-icons/ri";
import { Unauthorized } from "@/core/components/Unauthorized";
import { getProductoCompraById } from "@/tada/services/ventasProductosCompraApi";

const PERMISSION_PATH = "/dashboard/sales/productos-compra";

export default function ProductosCompraViewPage() {
    const { accessToken, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const productoId = params.id;

    /* ------------------- AUTORIZACIÓN ------------------- */
    const [authorized, setAuthorized] = useState(null);
    useEffect(() => {
        const ok =
            user?.role?.is_admin ||
            user?.role?.permissions?.some((p) => p.path === PERMISSION_PATH);
        setAuthorized(!!ok);
    }, [user, router]);

    /* ------------------- ESTADO ------------------- */
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* =========================================================
       Cargar producto
    ========================================================= */
    useEffect(() => {
        const loadProducto = async () => {
            if (!productoId || !accessToken) return;

            setLoading(true);
            try {
                const data = await getProductoCompraById(accessToken, productoId);
                setProducto(data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Error al cargar el producto");
            } finally {
                setLoading(false);
            }
        };

        loadProducto();
    }, [productoId, accessToken]);

    /* =========================================================
       Render
    ========================================================= */
    if (authorized === null) {
        return (
            <div className="flex justify-center items-center mt-64">
                <Loader size="lg" />
            </div>
        );
    }
    if (!authorized) return <Unauthorized />;

    if (loading) {
        return (
            <div className="flex justify-center items-center mt-64">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !producto) {
        return (
            <div className="text-black p-6">
                <div className="max-w-5xl mx-auto">
                    <Notification color="red" className="mb-4">
                        {error || "Producto no encontrado"}
                    </Notification>
                    <Button
                        variant="outline"
                        leftSection={<RiArrowLeftLine />}
                        onClick={() => router.push("/dashboard/sales/productos-compra")}
                    >
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-black">
            <div className="">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">{producto.name}</h1>
                        <p className="text-gray-600 mt-1">
                            Código: <span className="font-mono font-semibold">{producto.code}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            leftSection={<RiArrowLeftLine />}
                            onClick={() => router.push("/dashboard/sales/productos-compra")}
                        >
                            Volver
                        </Button>
                        <Button
                            leftSection={<RiEditLine />}
                            onClick={() =>
                                router.push(`/dashboard/sales/productos-compra/form?id=${productoId}`)
                            }
                        >
                            Editar
                        </Button>
                    </div>
                </div>

                {/* Información Básica */}
                <Card shadow="sm" padding="lg" className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Información Básica</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Código</label>
                            <div className="mt-1 font-mono font-semibold text-lg">
                                {producto.code}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Nombre</label>
                            <div className="mt-1 text-lg font-semibold">{producto.name}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Marca</label>
                            <div className="mt-1 text-lg">{producto.brand || "-"}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Categoría</label>
                            <div className="mt-1 text-lg">{producto.category || "-"}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Origen</label>
                            <div className="mt-1">
                                <Badge
                                    size="lg"
                                    color={producto.origen === "nacional" ? "green" : "blue"}
                                >
                                    {producto.origen}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Envase Principal
                            </label>
                            <div className="mt-1 text-lg">{producto.primary_can || "-"}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Retornable</label>
                            <div className="mt-1">
                                <Badge size="lg" color={producto.returnable ? "blue" : "gray"}>
                                    {producto.returnable ? "Sí" : "No"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Nombres Homologados */}
                {producto.homologated_names && producto.homologated_names.length > 0 && (
                    <Card shadow="sm" padding="lg" className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">Nombres Homologados</h2>
                        <div className="flex flex-wrap gap-2">
                            {producto.homologated_names.map((name, index) => (
                                <Badge key={index} size="lg" variant="outline" color="blue">
                                    {name}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Medidas y Presentación */}
                <Card shadow="sm" padding="lg" className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Medidas y Presentación</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Mililitros por Unidad
                            </label>
                            <div className="mt-1 text-lg font-semibold">
                                {producto.mililiters_per_unit || 0} ml
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Unidades por Caja
                            </label>
                            <div className="mt-1 text-lg font-semibold">
                                {producto.box_units || 0} unidades
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Costos */}
                <Card shadow="sm" padding="lg" className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Costos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Costo por Unidad
                            </label>
                            <div className="mt-1 text-lg font-semibold text-green-600">
                                S/ {parseFloat(producto.costs?.cost_per_unit || 0).toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Costo por Caja
                            </label>
                            <div className="mt-1 text-lg font-semibold text-green-600">
                                S/ {parseFloat(producto.costs?.cost_per_box || 0).toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Costo por Hectolitro
                            </label>
                            <div className="mt-1 text-lg font-semibold text-green-600">
                                S/ {parseFloat(producto.costs?.cost_per_hectoliter || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Metadatos */}
                <Card shadow="sm" padding="lg">
                    <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="text-gray-600">Fecha de Creación</label>
                            <div className="mt-1">
                                {producto.created_at
                                    ? new Date(producto.created_at).toLocaleString("es-ES", {
                                        dateStyle: "long",
                                        timeStyle: "short",
                                    })
                                    : "-"}
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-600">Última Actualización</label>
                            <div className="mt-1">
                                {producto.updated_at
                                    ? new Date(producto.updated_at).toLocaleString("es-ES", {
                                        dateStyle: "long",
                                        timeStyle: "short",
                                    })
                                    : "-"}
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-600">ID del Producto</label>
                            <div className="mt-1 font-mono">#{producto.id}</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
