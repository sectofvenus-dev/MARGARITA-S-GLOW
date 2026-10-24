# MARGARITA-S-GLOW
[README.md](https://github.com/user-attachments/files/33912192/README.md)
# Margarita's Glow — tienda online

Proyecto full-stack para el emprendimiento de maquillaje y accesorios **Margarita's Glow** (Villa Constitución, Salto, Uruguay). Está basado en Next.js App Router, TypeScript, Supabase y CSS responsive propio, con la marca original extraída de la tarjeta de presentación adjunta.

> **Estado real del proyecto:** el código de la aplicación y el esquema de base de datos están preparados, pero la tienda no queda conectada a datos reales ni publicada hasta que la propietaria configure un proyecto de Supabase, habilite la cuenta administrativa y cargue productos auténticos. No hay pasarela de tarjetas integrada. La transferencia es manual. El costo de envío queda pendiente de confirmación.

## Incluye

- Portada responsive con identidad visual rosa pastel, cereza y bordó, logotipo proporcionado, acceso a Instagram y WhatsApp.
- Catálogo con búsqueda, filtros de categoría/marca/precio/stock y ordenamiento.
- Ficha de producto, precio/promoción, stock, reseñas moderadas y cálculo de calificación.
- Carrito persistente en el navegador y validación del stock/precio real en PostgreSQL al crear el pedido.
- Finalización de pedido, número de pedido, preferencia de transportista y resumen para WhatsApp. El coste del envío no se inventa.
- Pago por transferencia manual. Los datos bancarios solo se sirven desde una ruta de servidor después de que se registra el pedido y se valida el token privado de ese pedido; se configuran en variables de entorno no públicas.
- Panel administrativo privado mediante Supabase Auth y RLS: productos y galería de fotos, precios, stock, visibilidad, destacados, pedidos, fichas de clientes asociadas a sus pedidos, estados de pago, reseñas y configuración de contacto/mensajes.
- Reseñas pendientes de moderación; la etiqueta de compra verificada requiere una asociación manual con un pedido registrado.
- Páginas de envíos, preguntas frecuentes y una base de políticas señalada para revisión antes de publicar.
- Metadatos básicos, Open Graph, `robots.txt`, `sitemap.xml` y pruebas de validación de pedidos.

### Alcance que aún requiere desarrollo o servicio externo

Esta entrega es una base funcional preparada para configurar, no una tienda ya conectada o publicada. No están implementados todavía: variantes estructuradas por tono/modelo; subida de fotos para reseñas; cotización automática, integración o tarifas por transportista; pasarela de pago con tarjeta; subida de comprobantes; envío automático de correos; ni límites anti-spam distribuidos/CAPTCHA verificado en servidor. El envío continúa pendiente de confirmación manual y las reseñas pueden incluir texto y estrellas, pero no fotografías. La configuración legal debe completarse y revisarse antes de vender.

## 1. Requisitos

- Node.js 20.9 o superior (se recomienda Node 22 LTS).
- npm.
- Una cuenta/proyecto en Supabase.
- Una cuenta de Netlify si vas a publicarla allí.

## 2. Instalar y ejecutar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí `http://localhost:3000`. Sin variables de Supabase, el sitio muestra estados vacíos honestos y no presenta productos, reseñas, inventario ni pedidos falsos.

## 3. Conectar Supabase

1. Creá un proyecto en Supabase.
2. En el SQL Editor, ejecutá el contenido completo de `supabase/schema.sql`.
3. En Project Settings → API, copiá la Project URL y la publishable/anon key a `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
   ```

   La clave pública está diseñada para usarse con RLS. **No agregues una service-role key al navegador ni al archivo `.env.example`.** Este proyecto no necesita una service-role key para el flujo normal.

4. En Supabase → Authentication, creá el usuario privado de administración usando tu correo y una contraseña robusta. No existe una contraseña predeterminada.
5. En Authentication → Users, copiá el UUID del usuario. En SQL Editor, añadilo a la lista de administradores:

   ```sql
   insert into public.app_admins (user_id, email, is_active)
   values ('UUID-DEL-USUARIO', 'tu-correo@example.com', true);
   ```

   Sustituí ambos valores por los reales. La inserción inicial se hace desde el SQL Editor, que tiene privilegios de administración. No habilites registros públicos para el panel.
6. En Storage, comprobá que se haya creado el bucket público `product-images` por el SQL. La lectura de imágenes es pública; la escritura requiere una sesión que esté en `app_admins`.
7. Si configurás el teléfono o Instagram en `store_settings`, usa los datos del negocio que quieras publicar.

### Configurar el método de transferencia

En `.env.local`, completá las siguientes variables **con los datos que aparecen en el PDF de pago adjunto**. Esas variables no tienen el prefijo `NEXT_PUBLIC_` y solo se leen desde la ruta del servidor:

```env
BANK_HOLDER=
BANK_NAME=
BANK_ACCOUNT=
```

Reiniciá `npm run dev` después de guardar los cambios. No copies los datos bancarios en componentes públicos, en la tabla pública de configuración ni en la portada. La ruta `/api/orders/payment-details` solo responde después de verificar el número y el token del pedido, y solo si el método es transferencia.

## 4. Cargar productos

1. Iniciá sesión desde `/admin/login`.
2. En “Productos”, ingresá nombre exacto, marca, SKU único, precio real, stock, categoría, descripción confirmada y fotografía individual del producto.
3. Para mostrar una promoción, el precio anterior debe ser mayor que el precio actual.
4. Activá “Publicado en la tienda” para que aparezca al público; los agotados se muestran como tales y no pueden agregarse al carrito.
5. Activá “Mostrar en destacados” para que aparezca en la portada.

No uses recortes de la cuadrícula de Instagram como fotografías individuales si no identifican claramente el producto. La aplicación no viene con una lista falsa de productos ni reseñas inventadas.

## 5. Administrar los pedidos

- Los pedidos aparecen en “Pedidos” y conservan una instantánea del nombre, SKU, precio y cantidad comprada.
- El total de productos se calcula en PostgreSQL. El precio enviado por el navegador se ignora.
- El stock se comprueba de forma transaccional y se reserva al registrar el pedido. Si se cancela desde el panel, el trigger devuelve el stock. Por seguridad, un pedido cancelado es terminal y no se reactiva desde el selector.
- El estado del pago empieza en `pendiente`. Marcalo confirmado solo cuando el comprobante haya sido revisado o exista confirmación bancaria real.
- No hay integración de pago con tarjetas, cobros automáticos ni subida de comprobantes en esta versión.

## 6. Reseñas

Las reseñas enviadas por clientas quedan en estado `pending` y no se publican hasta ser aprobadas desde el panel. Solo se puede activar “Compra verificada” desde administración después de asociar manualmente una reseña con un pedido existente no cancelado.

## 7. Pruebas y compilación

```bash
npm test
npm run build
```

Las pruebas verifican el esquema de validación de pedidos. Antes de la publicación definitiva, ejecutá además un pedido de prueba con productos de prueba en un proyecto aparte y revisá búsqueda, stock, cancelación, permisos del panel, moderación, respuesta de transferencia y vista móvil.

## 8. Publicar en Netlify

Netlify soporta Next.js App Router, Route Handlers y renderizado de servidor mediante su adaptador Next/OpenNext. Este proyecto necesita esas funciones; **no uses exportación estática**.

1. Subí el directorio del proyecto a un repositorio Git privado.
2. En Netlify, creá un sitio nuevo desde ese repositorio. El comando de build es `npm run build`.
3. En las variables de entorno del sitio, configurá las tres variables `NEXT_PUBLIC_SUPABASE_*` y las variables secretas `BANK_HOLDER`, `BANK_NAME`, `BANK_ACCOUNT` para los contextos de producción y deploy preview que corresponda. Nunca agregues los datos bancarios como `NEXT_PUBLIC_*`.
4. Configurá `NEXT_PUBLIC_SITE_URL` con la URL final una vez que exista el dominio.
5. Desplegá y revisá el log de build. El adaptador de Netlify debe gestionar las rutas API de Next.js. No agregues un redirect de SPA `/* /index.html 200`.
6. Probá el pedido completo, el retorno del token, la visualización de transferencia y los controles RLS en un entorno de prueba antes de aceptar pedidos reales.

## 9. Antes de abrir la tienda al público

- Completar y revisar las políticas de cambios, devoluciones, privacidad y condiciones de compra con información aplicable al negocio y a Uruguay.
- Activar protección anti-spam/rate limit y un CAPTCHA verificado en servidor para el endpoint público de pedidos y reseñas. Este proyecto deja preparado el flujo pero no incluye una cuenta de CAPTCHA ni limitador distribuido configurado.
- Comprobar almacenamiento, restauración y acceso a la base de datos.
- Configurar alertas/backups de Supabase y limitar los usuarios administradores.
- Probar la cancelación de pedidos y la devolución de stock en datos de prueba.
- Cargar solo imágenes, precios, marcas, promociones, stock, reseñas y políticas auténticas.
- La tienda no está desplegada por este proyecto y no se ha afirmado que se haya probado en un hosting real.

## Estructura principal

```text
src/
  app/                  Páginas, rutas API, metadata, sitemap y robots
  components/           Header, footer, catálogo, producto, carrito, home
  lib/                  Cliente Supabase, tipos, formato y validación
supabase/schema.sql     Tablas, funciones transaccionales, RLS, Storage
public/brand/           Logotipo original y símbolo de la marca
.env.example            Variables sin secretos reales
```
