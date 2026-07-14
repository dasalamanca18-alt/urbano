// Netlify Function: /api/urbano/productos
// Inventario con Netlify Blobs — GET público; POST/PUT/DELETE requieren clave (URBANO_CLAVE)

import { getStore } from "@netlify/blobs";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Urbano-Clave",
  "Content-Type": "application/json"
};

// Si URBANO_CLAVE no está configurada en Netlify, no se exige (modo abierto).
function claveOk(req) {
  const esperada = process.env.URBANO_CLAVE;
  if (!esperada) return true;
  return req.headers.get("x-urbano-clave") === esperada;
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  const store = getStore("urbano-inventario");
  const KEY = "productos";

  const leerProductos = async () => (await store.get(KEY, { type: "json" })) || [];
  const guardarProductos = (lista) => store.setJSON(KEY, lista);

  try {
    // GET -> lista todo (público: la tienda lo necesita)
    if (req.method === "GET") {
      const productos = await leerProductos();
      return new Response(JSON.stringify(productos), { status: 200, headers });
    }

    // Todo lo que sigue modifica datos: exige clave
    if (!claveOk(req)) {
      return new Response(JSON.stringify({ error: "Clave incorrecta o faltante" }), { status: 401, headers });
    }

    // POST -> agrega un producto
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const productos = await leerProductos();
      const nuevo = {
        id: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
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

    // PUT /:id -> actualiza campos de un producto existente
    if (req.method === "PUT") {
      const partes = new URL(req.url).pathname.split("/").filter(Boolean);
      const id = partes[partes.length - 1];
      const body = await req.json().catch(() => ({}));
      const productos = await leerProductos();
      const idx = productos.findIndex(p => p.id === id);
      if (idx < 0) {
        return new Response(JSON.stringify({ error: "Producto no encontrado" }), { status: 404, headers });
      }
      const p = productos[idx];
      if (body.nombre !== undefined) p.nombre = String(body.nombre);
      if (body.categoria !== undefined) p.categoria = String(body.categoria);
      if (body.descripcion !== undefined) p.descripcion = String(body.descripcion);
      if (body.imagen !== undefined) p.imagen = String(body.imagen);
      if (body.precio !== undefined) p.precio = Number(body.precio) || 0;
      if (body.stock !== undefined) p.stock = Number(body.stock) || 0;
      if (body.destacado !== undefined) p.destacado = !!body.destacado;
      p.actualizadoEn = new Date().toISOString();
      await guardarProductos(productos);
      return new Response(JSON.stringify({ ok: true, producto: p }), { status: 200, headers });
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
