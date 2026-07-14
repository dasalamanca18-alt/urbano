// Netlify Function: /api/urbano/productos
// Maneja el inventario completo usando Netlify Blobs (almacenamiento incluido gratis).

import { connectLambda, getStore } from "@netlify/blobs";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  connectLambda(event);
  const store = getStore("urbano-inventario");
  const KEY = "productos";

  async function leerProductos() {
    const data = await store.get(KEY, { type: "json" });
    return data || [];
  }
  async function guardarProductos(lista) {
    await store.setJSON(KEY, lista);
  }

  try {
    // GET /api/urbano/productos -> lista todo
    if (event.httpMethod === "GET") {
      const productos = await leerProductos();
      return { statusCode: 200, headers, body: JSON.stringify(productos) };
    }

    // POST /api/urbano/productos -> agrega un producto
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const productos = await leerProductos();
      const nuevo = {
        id: "p_" + Date.now(),
        nombre: body.nombre || "Producto sin nombre",
        categoria: body.categoria || "General",
        precio: Number(body.precio) || 0,
        stock: Number(body.stock) || 0,
        descripcion: body.descripcion || "",
        imagen: body.imagen || "",
        destacado: !!body.destacado,
        creadoEn: new Date().toISOString()
      };
      productos.push(nuevo);
      await guardarProductos(productos);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, producto: nuevo }) };
    }

    // DELETE /api/urbano/productos/:id -> elimina un producto
    if (event.httpMethod === "DELETE") {
      const partes = event.path.split("/").filter(Boolean);
      const id = partes[partes.length - 1];
      let productos = await leerProductos();
      productos = productos.filter(p => p.id !== id);
      await guardarProductos(productos);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
