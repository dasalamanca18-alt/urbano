// Netlify Function: /api/urbano/imagenes
// Sube y sirve imágenes usando Netlify Blobs (gratis, sin servidor externo).
// POST  /api/urbano/imagenes      -> recibe { data: base64, tipo: "image/jpeg" } y guarda
// GET   /api/urbano/imagenes/:id  -> devuelve la imagen (para usar en <img src>)

import { getStore } from "@netlify/blobs";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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
    return new Response("", { status: 200, headers: jsonHeaders });
  }

  const store = getStore("urbano-media");

  try {
    // GET /:id -> devolver la imagen guardada
    if (req.method === "GET") {
      const partes = new URL(req.url).pathname.split("/").filter(Boolean);
      const id = partes[partes.length - 1];
      if (!id || id === "imagenes") {
        return new Response(JSON.stringify({ error: "Falta el id de la imagen" }), { status: 400, headers: jsonHeaders });
      }
      const resultado = await store.getWithMetadata(id, { type: "arrayBuffer" });
      if (!resultado || !resultado.data) {
        return new Response(JSON.stringify({ error: "Imagen no encontrada" }), { status: 404, headers: jsonHeaders });
      }
      const tipo = (resultado.metadata && resultado.metadata.tipo) || "image/jpeg";
      return new Response(resultado.data, {
        status: 200,
        headers: {
          "Content-Type": tipo,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // POST -> guardar imagen nueva (base64) — exige clave
    if (req.method === "POST") {
      if (!claveOk(req)) {
        return new Response(JSON.stringify({ error: "Clave incorrecta o faltante" }), { status: 401, headers: jsonHeaders });
      }
      const body = await req.json().catch(() => ({}));
      if (!body.data) {
        return new Response(JSON.stringify({ error: "Falta el campo data (base64)" }), { status: 400, headers: jsonHeaders });
      }
      // Límite de seguridad: ~4.5 MB en base64 (las funciones de Netlify no aceptan más)
      if (body.data.length > 4.5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Imagen demasiado grande. Máximo ~3 MB." }), { status: 413, headers: jsonHeaders });
      }
      const tipo = body.tipo || "image/jpeg";
      const bytes = Buffer.from(body.data, "base64");
      const id = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      await store.set(id, bytes, { metadata: { tipo } });
      return new Response(JSON.stringify({ ok: true, url: "/api/urbano/imagenes/" + id }), { status: 200, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers: jsonHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
  }
};
