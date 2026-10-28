# Perigeo — app de lectura

App web instalable (PWA) que reproduce el diseño de *Perigeo · Nº 01* y carga
cada número desde un archivo JSON. Un único código sirve para Mac, PC e iPhone.

## Estructura

```
index.html            Página y paleta de colores (claro / oscuro)
app.js                Pinta un número a partir de su JSON con el diseño original
sw.js                 Funcionamiento sin conexión y actualización automática
manifest.webmanifest  Nombre, icono y modo "app" al instalarla
icons/                Iconos de la app
issues/index.json     Lista de números publicados
issues/NN.json        Contenido de cada número
```

## Publicar el número de la semana

1. Copia `issues/01.json` como `issues/02.json` (03, 04…) y cambia el contenido.
   Mantén la misma estructura; los textos admiten `<b>` y `<em>`.
2. Añade una línea en `issues/index.json`:
   ```json
   { "number": 2, "file": "02.json", "week": 45, "date": "2026-11-04", "dateLabel": "4 nov 2026" }
   ```
3. Sube los cambios al alojamiento. La app abre siempre el número más reciente;
   en cuanto hay dos o más, al final aparece «Números anteriores».

### Piezas disponibles en cada sección

- Apertura (`lead.type`): `quote` (artículo + cita, como Geopolítica),
  `split` (dos columnas, como Espacio) o `stat` (cifra grande, como España).
- Bloques (`blocks[].type`): `analysis`, `briefs`, `orbitmap` (mapa cislunar),
  `timeline` y `agenda` (dato de la semana, radar y notas).

Las secciones, sus números romanos y el menú superior salen de `sections`, así
que se pueden cambiar de una semana a otra.

## Probar en local

```bash
python3 -m http.server 8765 --directory perigeo
```

Abre http://localhost:8765.

## Instalar la app (una vez publicada en una dirección https)

- **iPhone / iPad:** Safari → Compartir → «Añadir a pantalla de inicio».
- **Mac:** Safari → Archivo → «Añadir al Dock» (o Chrome → Instalar Perigeo).
- **PC con Windows:** Edge o Chrome → icono «Instalar» en la barra de direcciones.

La app se abre en su propia ventana, sin barra del navegador, funciona sin
conexión con el último número descargado y busca uno nuevo cada vez que se abre.
