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
import { getProductoAppById } from "@/tada/services/ventasProductosAppApi";

const PERMISSION_PATH = "/dashboard/sales/productos-app";

export default function ProductosAppViewPage() {
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
                const data = await getProductoAppById(accessToken, productoId);
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
                        onClick={() => router.push("/dashboard/sales/productos-app")}
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
                            onClick={() => router.push("/dashboard/sales/productos-app")}
                        >
                            Volver
                        </Button>
                        <Button
                            leftSection={<RiEditLine />}
                            onClick={() => router.push(`/dashboard/sales/productos-app/form?id=${productoId}`)}
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
                            <label className="text-sm font-medium text-gray-600">Tipo</label>
                            <div className="mt-1">
                                <Badge
                                    size="lg"
                                    color={producto.type === "principal" ? "blue" : "orange"}
                                >
                                    {producto.type}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Código</label>
                            <div className="mt-1 font-mono font-semibold text-lg">
                                {producto.code}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">Nombre</label>
                            <div className="mt-1 text-lg font-semibold">
                                {producto.name}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Unidad</label>
                            <div className="mt-1 text-lg">
                                {producto.unit}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Materiales (Productos Compra) */}
                <Card shadow="sm" padding="lg" className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Materiales (Productos Compra)
                    </h2>

                    {(producto.material_items || []).length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                                <p className="text-gray-500">
                                    No hay materiales asociados
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left p-3">#</th>
                                            <th className="text-left p-3">Código</th>
                                            <th className="text-left p-3">Nombre</th>
                                            <th className="text-left p-3">Marca</th>
                                            <th className="text-right p-3">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {producto.material_items.map((mat, index) => (
                                            <tr key={mat.id} className="border-t hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                                        {mat.ventas_productos_compra?.code}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-semibold">
                                                    {mat.ventas_productos_compra?.name}
                                                </td>
                                                <td className="p-3 text-gray-600">
                                                    {mat.ventas_productos_compra?.brand || "-"}
                                                </td>
                                                <td className="p-3 text-right font-semibold">
                                                    {parseFloat(mat.quantity).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={4} className="p-3 text-right font-semibold">
                                                Total de materiales:
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                                {producto.material_items.length}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
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
                            <div className="mt-1 font-mono">
                                #{producto.id}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
