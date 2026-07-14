// Netlify Function: /api/urbano/diseno
// Guarda las zonas de diseño editables de la página pública (arriba y abajo del catálogo).
// GET  -> devuelve { arriba, abajo, css } (público: la tienda lo necesita para pintarse)
// POST -> guarda el diseño (requiere la clave URBANO_CLAVE)

import { getStore } from "@netlify/blobs";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Urbano-Clave",
  "Content-Type": "application/json"
};

// Si URBANO_CLAVE no está configurada en Netlify, no se exige (modo abierto).
// Configúrala en: Site configuration -> Environment variables.
function claveOk(req) {
  const esperada = process.env.URBANO_CLAVE;
  if (!esperada) return true;
  return req.headers.get("x-urbano-clave") === esperada;
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  const store = getStore("urbano-config");
  const KEY = "diseno";

  try {
    if (req.method === "GET") {
      const diseno = (await store.get(KEY, { type: "json" })) || {};
      return new Response(JSON.stringify(diseno), { status: 200, headers });
    }

    if (req.method === "POST") {
      if (!claveOk(req)) {
        return new Response(JSON.stringify({ error: "Clave incorrecta o faltante" }), { status: 401, headers });
      }
      const body = await req.json().catch(() => ({}));
      const diseno = {
        arriba: String(body.arriba || ""),
        abajo: String(body.abajo || ""),
        css: String(body.css || ""),
        actualizadoEn: new Date().toISOString()
      };
      const tam = diseno.arriba.length + diseno.abajo.length + diseno.css.length;
      if (tam > 1.5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "El diseño es demasiado grande" }), { status: 413, headers });
      }
      await store.setJSON(KEY, diseno);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};
