# URBANO — Instrucciones de instalación (100% Netlify, sin servidor externo)

## Arquitectura

Todo el proyecto vive dentro de Netlify — no depende de ningún otro servidor:

- **La página pública** (`site/index.html`) — catálogo, carrito, WhatsApp.
- **El panel de inventario** (`site/admin.html`) — agregar/quitar productos.
- **El editor de diseño** (`site/editor.html`) — GrapesJS, para editar textos y bloques visuales.
- **La API del inventario** (`netlify/functions/productos.js`) — código que corre "bajo demanda"
  dentro de Netlify cada vez que la página pide o guarda datos.
- **El almacenamiento** (Netlify Blobs) — donde quedan guardados los productos de forma permanente,
  visible para todos los que visiten la página. Está incluido gratis en el plan Free de Netlify.

## Estructura de carpetas que recibiste

```
urbano2/
├── netlify.toml              <- configuración de Netlify (no tocar)
├── package.json               <- dependencias (no tocar)
├── netlify/
│   └── functions/
│       └── productos.js       <- la API del inventario
└── site/
    ├── index.html              <- página pública
    ├── admin.html               <- panel de inventario
    ├── editor.html              <- editor visual GrapesJS
    └── productos.json            <- catálogo de respaldo (ejemplo)
```

**Importante:** para que las Netlify Functions funcionen, hay que subir la carpeta `urbano2` COMPLETA
(no solo la carpeta `site`), incluyendo `netlify.toml`, `package.json` y la carpeta `netlify/`.

## Paso 1 — Crear cuenta en Netlify

Ve a [netlify.com](https://netlify.com) y crea una cuenta gratis (con correo, sin tarjeta).

## Paso 2 — Subir el proyecto

La forma más simple, sin usar terminal ni GitHub:

1. En el panel de Netlify, busca "Add new site" → "Deploy manually".
2. Arrastra la carpeta `urbano2` completa a la zona de arrastre.
3. Netlify detecta automáticamente la función y el sitio, instala lo necesario, y te da un link público
   en 1-2 minutos (ej. `urbano-shop-xyz.netlify.app`).

Si en el futuro quieres actualizar el sitio (nuevo diseño, cambios de texto), repites este mismo paso
arrastrando la carpeta actualizada.

## Paso 3 — Confirmar que el inventario funciona

1. Abre tu link de Netlify + `/admin.html` (ej. `urbano-shop-xyz.netlify.app/admin.html`).
2. Agrega un producto de prueba.
3. Abre la página principal (`urbano-shop-xyz.netlify.app`) — el producto debe aparecer ahí.
4. Si algo no aparece, revisa en Netlify: panel del sitio → "Functions" → deberías ver `productos`
   listada y activa.

## Paso 4 — Editar el diseño con GrapesJS

Abre `editor.html` (puedes abrirlo localmente en tu computador, no hace falta subirlo).
Arrastra bloques, edita textos con doble clic, y presiona "Exportar HTML" para descargar el diseño
y combinarlo con `index.html` antes de volver a subir el proyecto.

## Seguridad — pendiente importante

`admin.html` no tiene contraseña — cualquiera con el link podría agregar o borrar productos.
Antes de entregarle el link de administración a tu cliente, recomiendo agregar una clave de acceso
simple. Avísame y te la agrego antes de la entrega final.

## Notas del funcionamiento

- El carrito NO usa pasarela de pagos — arma el mensaje de WhatsApp automáticamente con la lista de
  productos y el total, y abre WhatsApp con todo precargado. El pago se coordina directo con el cliente.
- Número de WhatsApp configurado: **+57 314 596 0887**
- La verificación de edad se guarda en el navegador del visitante (no se repite en su próxima visita).
- Costo: **$0**. Todo corre dentro del plan gratuito de Netlify (funciones, almacenamiento y hosting).
