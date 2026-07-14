// Netlify Function: /api/urbano/categorias
// Gestión de categorías de productos con Netlify Blobs.
// GET lista | POST {nombre} agrega | PUT /:nombre {nuevo} renombra (y actualiza productos) | DELETE /:nombre elimina

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

const CATEGORIAS_INICIALES = ["Accesorios", "Papeles", "Aromáticos", "Encendedores", "Ropa", "Otro"];

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  const config = getStore("urbano-config");
  const inventario = getStore("urbano-inventario");
  const KEY = "categorias";

  const leer = async () => {
    const data = await config.get(KEY, { type: "json" });
    return Array.isArray(data) && data.length ? data : [...CATEGORIAS_INICIALES];
  };
  const guardar = (lista) => config.setJSON(KEY, lista);

  const nombreDesdeRuta = () => {
    const partes = new URL(req.url).pathname.split("/").filter(Boolean);
    return decodeURIComponent(partes[partes.length - 1] || "");
  };

  try {
    // GET -> lista de categorías (público)
    if (req.method === "GET") {
      const cats = await leer();
      return new Response(JSON.stringify(cats), { status: 200, headers });
    }

    // Todo lo que sigue modifica datos: exige clave
    if (!claveOk(req)) {
      return new Response(JSON.stringify({ error: "Clave incorrecta o faltante" }), { status: 401, headers });
    }

    // POST {nombre} -> agrega una categoría
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const nombre = (body.nombre || "").trim();
      if (!nombre) {
        return new Response(JSON.stringify({ error: "Falta el nombre de la categoría" }), { status: 400, headers });
      }
      const cats = await leer();
      if (cats.some(c => c.toLowerCase() === nombre.toLowerCase())) {
        return new Response(JSON.stringify({ error: "Esa categoría ya existe" }), { status: 409, headers });
      }
      cats.push(nombre);
      await guardar(cats);
      return new Response(JSON.stringify({ ok: true, categorias: cats }), { status: 200, headers });
    }

    // PUT /:nombre {nuevo} -> renombra la categoría y actualiza los productos que la usan
    if (req.method === "PUT") {
      const actual = nombreDesdeRuta();
      const body = await req.json().catch(() => ({}));
      const nuevo = (body.nuevo || "").trim();
      if (!actual || !nuevo) {
        return new Response(JSON.stringify({ error: "Faltan datos para renombrar" }), { status: 400, headers });
      }
      let cats = await leer();
      const idx = cats.findIndex(c => c === actual);
      if (idx < 0) {
        return new Response(JSON.stringify({ error: "Categoría no encontrada" }), { status: 404, headers });
      }
      if (cats.some(c => c.toLowerCase() === nuevo.toLowerCase() && c !== actual)) {
        return new Response(JSON.stringify({ error: "Ya existe una categoría con ese nombre" }), { status: 409, headers });
      }
      cats[idx] = nuevo;
      await guardar(cats);

      // Actualizar los productos que tenían la categoría vieja
      const productos = (await inventario.get("productos", { type: "json" })) || [];
      let actualizados = 0;
      for (const p of productos) {
        if (p.categoria === actual) { p.categoria = nuevo; actualizados++; }
      }
      if (actualizados > 0) await inventario.setJSON("productos", productos);

      return new Response(JSON.stringify({ ok: true, categorias: cats, productosActualizados: actualizados }), { status: 200, headers });
    }

    // DELETE /:nombre -> elimina la categoría (los productos que la usaban pasan a "Otro")
    if (req.method === "DELETE") {
      const nombre = nombreDesdeRuta();
      let cats = await leer();
      if (!cats.includes(nombre)) {
        return new Response(JSON.stringify({ error: "Categoría no encontrada" }), { status: 404, headers });
      }
      cats = cats.filter(c => c !== nombre);
      if (!cats.length) cats = ["Otro"]; // nunca dejar la lista vacía
      await guardar(cats);

      // Reasignar productos huérfanos a "Otro"
      const productos = (await inventario.get("productos", { type: "json" })) || [];
      let movidos = 0;
      for (const p of productos) {
        if (p.categoria === nombre) { p.categoria = "Otro"; movidos++; }
      }
      if (movidos > 0) {
        if (!cats.includes("Otro")) { cats.push("Otro"); await guardar(cats); }
        await inventario.setJSON("productos", productos);
      }

      return new Response(JSON.stringify({ ok: true, categorias: cats, productosMovidos: movidos }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};
