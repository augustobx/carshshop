# Almacenamiento de imágenes - OnlyCars

OnlyCars usa almacenamiento de objetos para imágenes. La base de datos guarda únicamente URL y metadatos; los bytes no se almacenan en MariaDB.

## Producción

`STORAGE_PROVIDER=r2`

Variables compatibles con el esquema usado por OnlyFood:

- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_URL`
- `STORAGE_PREFIX=onlycars`

OnlyCars puede reutilizar el mismo bucket/CDN de NanoLabs que OnlyFood. Los objetos quedan separados por aplicación y tenant:

`onlycars/tenants/<tenantId>/vehicles/...`

`onlycars/tenants/<tenantId>/branding/...`

## Desarrollo

`STORAGE_PROVIDER=local` escribe bajo `public/uploads/onlycars/tenants/...`.

El almacenamiento local está bloqueado en producción salvo que se habilite explícitamente `ALLOW_LOCAL_STORAGE=true`; no debe utilizarse para un despliegue SaaS productivo.

## Seguridad

- El object key lo genera exclusivamente el servidor.
- Cada borrado valida que la clave pertenezca al tenant actual.
- Formatos aceptados: JPG, PNG, WebP y AVIF.
- Tamaño máximo: 10 MB por imagen.
- Se valida MIME y firma binaria antes de guardar.
- El bucket no necesita listado público. La lectura se realiza mediante `R2_PUBLIC_URL`/CDN.
- Las credenciales R2 nunca se envían al navegador.

## VehiculoFoto

`url_foto` contiene la URL pública CDN.

`object_key` contiene la clave privada necesaria para eliminar el objeto remoto.

`mime_type` y `size_bytes` conservan metadatos útiles sin cargar la base con el archivo.

Las filas antiguas que todavía contengan una URL/base64 pueden seguir visualizándose. Los nuevos uploads se almacenan exclusivamente en R2.
