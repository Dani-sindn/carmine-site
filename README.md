# CARMINE — sitio web

Propuesta de web para CARMINE. El concepto es **«Mira un minuto más»**: el color aparece cuando te detienes. Usa las obras reales del artista, y su lenguaje (contornos negros orgánicos y líneas neón que lo cruzan todo) se vuelve el lenguaje de la interfaz: bordes ondulados, manchas que respiran y líneas que se dibujan solas.

Es un sitio estático, sin build: `index.html`, `styles.css`, `main.js` y `config.js`. Las obras están en `assets/art/` (los originales enviados se guardan en local, fuera del repo). Está en español y en inglés (selector ES / EN).

La revisión del brief y las decisiones pendientes del artista están en `DECISIONES.md`, que se guarda en local y no se publica.

## Ver en local

```bash
python3 -m http.server 4190
```

Abrir http://localhost:4190. Si cambias CSS o JS, sube el `?v=` de `index.html` para evitar la caché.

## Recorrido

| # | Sección | Interacción | Obra |
|---|---|---|---|
| — | Barra superior | El wordmark CARMINE se llena de carmín durante el primer minuto. Al llegar a 1:00 hay un estallido de líneas neón y la obra del inicio se colorea entera | — |
| — | Entre secciones | Costuras: bordes ondulados con tres líneas neón que se dibujan al llegar | — |
| 01 | Mira un minuto más | La obra en gris, con el centro encendido. **Mantén presionado** y el color se derrama desde el dedo en manchas y venas. En desktop, el cursor deja una estela neón | Huella (rostro concéntrico) |
| 02 | El origen | Scroll en cuatro capítulos: un trazo de niño que se enrolla como un sol → el dibujo a lápiz se abre en una mancha → la obra en gris → el color estalla **dentro** del gris, con contornos negro y neón que respiran | Rinoceronte (lápiz), Arquitectura |
| 03 | Mira más cerca | Lupa ×3 y **5 detalles** reales de la obra (ojo, soles dormidos, figura azul, flores, firma) | Ojo y soles |
| 03 | De la línea al color | Comparador. La versión de línea se genera separando los contornos negros de la pintura | Ave y madre |
| 04 | CARMINE ART | **La obra suena**: cada color es una nota y el poema aparece verso a verso. Al terminar, estallido | Sueño (figura dormida) |
| 04 | La galería | Las 9 obras en marcos que cambian de forma. Solo la del centro se enciende (las de color pasan de gris a color, las de lápiz pasan de borrosas a nítidas). Al tocarla se abre a pantalla completa y se desliza | Todas |
| 05 | CARMINE SPORT | Página para colorear con fondo de bandas onduladas. El color entra como una mancha. Completarla dispara un estallido | Provisional |
| 06 | Colecciones | Libros en 3D con páginas de muestra, hechas con las obras reales | Ojo, Ave, Rinoceronte |
| 07 | Beyond the Canvas | Constelación con aristas curvas y neón | — |
| 08 | El arte continúa contigo | Postal con el detalle que encontró el visitante, recortada en una mancha con contorno neón | Ojo y soles |

## Qué se cambia y dónde

Todo el contenido está en `config.js`:

- `works`: las obras (ruta, color o lápiz, año, proporción y título). Para cambiar una imagen, reemplaza el archivo en `assets/art/` con el mismo nombre.
- `roles`: qué obra aparece en cada momento (inicio, lupa, comparador, sonido, historia y libro).
- `details`: los 5 detalles de la lupa. Las coordenadas `x` e `y` van de 0 a 1 sobre la imagen. Si cambias la obra de la lupa, hay que reubicarlos.
- `poem`, `books`, `connections` y `email`.
- `CARMINE_STR`: todos los textos de interfaz en ES y EN.

## Notas técnicas

- **Imágenes.** Las obras se cargan desde `assets/art/`. La versión en gris del inicio y la versión de línea del comparador se generan en el navegador, así que hace falta servir el sitio (no abrirlo con `file://`).
- **Mobile primero.** Cada gesto respeta el scroll vertical: la lupa y el comparador solo capturan el arrastre sobre su asa, y el resto de la obra responde a toques. No hay scroll horizontal de página (verificado a 375 px).
- **Sonido.** Web Audio, sin archivos. En iPhone no suena si el modo silencio está activo (la página lo avisa). Si llega una pista real, se pone en `config.js → music` (falta conectarla).
- **Formulario.** Sin backend: con `email` configurado abre el correo del visitante; si está vacío, muestra que falta conectarlo.
- **Movimiento reducido.** Con `prefers-reduced-motion` se quitan las animaciones automáticas.

## Provisional (no publicar sin reemplazar)

- Las obras están a 768 px de ancho: hacen falta los archivos en alta resolución.
- Faltan los títulos de las obras y los textos de los detalles de la lupa (los actuales son descriptivos).
- La versión de línea del comparador sale de la pintura, no de un boceto real.
- El poema, los títulos de los libros, la página para colorear y los formatos de colaboración son de muestra.
- No hay enlaces de compra, email, redes ni exposiciones reales.
