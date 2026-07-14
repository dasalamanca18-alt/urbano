// Netlify Function: /api/urbano/productos
// Inventario con Netlify Blobs — formato moderno (Functions v2)

import { getStore } from "@netlify/blobs";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  const store = getStore("urbano-inventario");
  const KEY = "productos";

  const leerProductos = async () => (await store.get(KEY, { type: "json" })) || [];
  const guardarProductos = (lista) => store.setJSON(KEY, lista);

  try {
    // GET -> lista todo
    if (req.method === "GET") {
      const productos = await leerProductos();
      return new Response(JSON.stringify(productos), { status: 200, headers });
    }

    // POST -> agrega un producto
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
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
      return new Response(JSON.stringify({ ok: true, producto: nuevo }), { status: 200, headers });
    }

    // DELETE /:id -> elimina un producto
    if (req.method === "DELETE") {
      const partes = new URL(req.url).pathname.split("/").filter(Boolean);
      const id = partes[partes.length - 1];
      let productos = await leerProductos();
      productos = productos.filter(p => p.id !== id);
      await guardarProductos(productos);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};
