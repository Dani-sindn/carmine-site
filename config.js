/* CARMINE — contenido editable.
   Todo lo marcado con [PROVISIONAL] espera el material real del artista (ver DECISIONES.md). */

window.CARMINE = {
  // Email de contacto. Vacío = el formulario muestra que falta conectarlo. [PROVISIONAL]
  email: "",

  // Obras reales del artista (assets/art). Los títulos están vacíos hasta que Max los confirme:
  // mientras tanto la galería muestra «Nº 01 · Color · 2023». Años tomados de la firma. [TÍTULOS PENDIENTES]
  works: [
    { id: "huella", src: "assets/art/color-huella.jpg", kind: "color", year: 2023, ratio: 0.75, title: { es: "", en: "" } },
    { id: "ojo", src: "assets/art/color-ojo.jpg", kind: "color", year: 2023, ratio: 0.75, title: { es: "", en: "" } },
    { id: "sueno", src: "assets/art/color-sueno.jpg", kind: "color", year: 2023, ratio: 0.75, title: { es: "", en: "" } },
    { id: "ave", src: "assets/art/color-ave.jpg", kind: "color", year: 2023, ratio: 0.75, title: { es: "", en: "" } },
    { id: "arquitectura", src: "assets/art/color-arquitectura.jpg", kind: "color", year: 2023, ratio: 0.75, title: { es: "", en: "" } },
    { id: "mariposa", src: "assets/art/color-mariposa.jpg", kind: "color", year: 2023, ratio: 1.333, title: { es: "", en: "" } },
    { id: "rinoceronte", src: "assets/art/lapiz-rinoceronte.jpg", kind: "pencil", year: 2022, ratio: 0.759, title: { es: "", en: "" } },
    { id: "flamenco", src: "assets/art/lapiz-flamenco.jpg", kind: "pencil", year: 2022, ratio: 1.418, title: { es: "", en: "" } },
    { id: "colibries", src: "assets/art/lapiz-colibries.jpg", kind: "pencil", year: 2021, ratio: 1.37, title: { es: "", en: "" } }
  ],

  // Qué obra vive en cada momento del recorrido
  roles: { hero: "huella", loupe: "ojo", compare: "ave", score: "sueno", storyPencil: "rinoceronte", storyColor: "arquitectura", book: "ojo" },

  // Pista de audio real para CARMINE ART. Vacío = la pintura se sonifica (color → notas). [PROVISIONAL]
  music: "",

  // Cinco detalles de la obra «ojo». x, y en proporción de la imagen (0–1).
  // Los textos son descriptivos y provisionales: lo ideal es que los escriba Max. [PROVISIONAL]
  details: {
    eye: {
      x: 0.465, y: 0.455,
      es: ["El ojo abierto", "En el centro de todo hay un ojo despierto. Mientras miras la obra, la obra también te mira."],
      en: ["The open eye", "At the center of everything there's an eye wide awake. While you look at the work, the work looks back."]
    },
    sleeper: {
      x: 0.27, y: 0.42,
      es: ["Los soles dormidos", "A cada lado, un sol con los ojos cerrados. Solo el centro está despierto."],
      en: ["The sleeping suns", "On each side, a sun with its eyes closed. Only the center is awake."]
    },
    figure: {
      x: 0.565, y: 0.62,
      es: ["La figura azul", "Una pequeña figura se estira hacia la luz entre las líneas. Es fácil pasarla por alto."],
      en: ["The blue figure", "A small figure reaches toward the light between the lines. It's easy to miss."]
    },
    flowers: {
      x: 0.425, y: 0.842,
      es: ["Flores en la sombra", "Al pie de la obra crecen flores diminutas, dibujadas casi en secreto."],
      en: ["Flowers in the shade", "At the foot of the work, tiny flowers grow, drawn almost in secret."]
    },
    signature: {
      x: 0.707, y: 0.894,
      es: ["La firma", "Carmine, 2023. La última línea de la obra y la primera pista de quién la hizo."],
      en: ["The signature", "Carmine, 2023. The last line of the work and the first clue to who made it."]
    }
  },

  // Poema de muestra para CARMINE ART. [PROVISIONAL: reemplazar por un poema de Max]
  poem: {
    es: ["Por fuera, todo es gris.", "Por dentro, arde.", "Quédate un minuto más:", "el color también", "tarda en llegar", "a quien sabe esperar."],
    en: ["On the outside, all is grey.", "On the inside, it burns.", "Stay one minute more:", "color, too,", "takes its time", "to reach those who wait."]
  },

  // Catálogo editorial. buy: "" → el botón pasa a «Avísame» y lleva a contacto. [PROVISIONAL]
  books: [
    {
      id: "art-1", line: "art", cover: "painting",
      title: { es: "Mira un minuto más", en: "Look One Minute More" },
      kicker: { es: "CARMINE ART", en: "CARMINE ART" },
      desc: {
        es: "Pinturas, dibujos a lápiz y poemas reunidos en un mismo libro: la obra a color y su origen en grafito, página a página.",
        en: "Paintings, pencil drawings and poems in a single book: each work in color beside its graphite origin, page after page."
      },
      buy: ""
    },
    {
      id: "sport-1", line: "sport", cover: "jersey",
      title: { es: "Historias del 10", en: "Stories of the 10" },
      kicker: { es: "CARMINE SPORT · Vol. I", en: "CARMINE SPORT · Vol. I" },
      desc: {
        es: "Historias deportivas convertidas en libro ilustrado, con contexto cultural para leer, mirar y conversar.",
        en: "Sports stories turned into an illustrated book, with cultural context to read, look at and talk about."
      },
      buy: ""
    },
    {
      id: "sport-2", line: "sport", cover: "lines",
      title: { es: "Colorea la jugada", en: "Color the Play" },
      kicker: { es: "CARMINE SPORT · Para colorear", en: "CARMINE SPORT · Coloring" },
      desc: {
        es: "Páginas para colorear basadas en las ilustraciones originales. El lector termina la obra.",
        en: "Coloring pages drawn from the original illustrations. The reader finishes the artwork."
      },
      buy: ""
    },
    {
      id: "sport-3", line: "sport", cover: "maze",
      title: { es: "Mente en juego", en: "Mind in Play" },
      kicker: { es: "CARMINE SPORT · Actividades", en: "CARMINE SPORT · Activities" },
      desc: {
        es: "Actividades cognitivas inspiradas en el deporte: memoria, atención, lógica y creatividad.",
        en: "Sport-inspired cognitive activities: memory, attention, logic and creativity."
      },
      buy: ""
    }
  ],

  // Formatos de colaboración que CARMINE ofrece. Son propuestas, no proyectos realizados. [VALIDAR]
  connections: {
    galleries: {
      links: ["painting", "poetry", "music"],
      es: ["Galerías", "Exposición multisensorial", "Obra, poema y composición en una misma sala. El público no solo mira: escucha, lee y se acerca."],
      en: ["Galleries", "Multisensory exhibition", "Work, poem and composition in a single room. Visitors don't just look: they listen, read and lean in."]
    },
    institutions: {
      links: ["sport", "culture", "creativity"],
      es: ["Instituciones", "Programas educativos", "Los libros de CARMINE SPORT como herramienta en el aula: historia, ilustración y actividades cognitivas."],
      en: ["Institutions", "Educational programs", "CARMINE SPORT books as classroom tools: history, illustration and cognitive activities."]
    },
    culture: {
      links: ["painting", "sport", "culture"],
      es: ["Organizaciones culturales", "Ediciones y piezas especiales", "Obras e ilustraciones a medida para festivales, clubes, aniversarios y encuentros."],
      en: ["Cultural organizations", "Special editions & pieces", "Commissioned works and illustrations for festivals, clubs, anniversaries and gatherings."]
    }
  }
};

/* Textos de interfaz. Las claves coinciden con data-i18n en index.html. */
window.CARMINE_STR = {
  es: {
    "skip": "Saltar al contenido",
    "nav.home": "Inicio", "nav.story": "Historia", "nav.art": "Carmine Art", "nav.sport": "Carmine Sport",
    "nav.collections": "Colecciones", "nav.contact": "Contacto", "nav.menu": "Menú", "nav.close": "Cerrar",
    "minute.label": "Tu minuto",
    "minute.toast": "Miraste un minuto más.", "minute.toast2": "A partir de ahora, todo tiene color.",

    "hero.kicker": "CARMINE — Arte · Poesía · Música · Deporte",
    "hero.title": "Mira un<br><em>minuto más</em>",
    "hero.hint": "Mantén presionado sobre la obra",
    "hero.hint2": "El color aparece cuando te detienes",
    "hero.scroll": "Desliza",

    "story.num": "02 — El origen",
    "story.title": "De un niño dibujando a los cinco años a un <em>universo propio</em>.",
    "story.c1.k": "A los cinco años", "story.c1.t": "Todo empezó con un lápiz. Max Emiliano Dell Carmine dibujaba antes de saber qué era el arte.",
    "story.c2.k": "La arquitectura", "story.c2.t": "Después llegó la arquitectura: aprender a ver la estructura, la proporción y la luz que hay detrás de cada forma.",
    "story.c3.k": "Nueva York", "story.c3.t": "La vida en Nueva York le dio a ese trazo una ciudad, un ritmo y un escenario.",
    "story.c4.k": "CARMINE", "story.c4.t": "Así nació CARMINE, un universo artístico y editorial propio. <em>Monocromo por fuera. Una explosión de color por dentro.</em>",

    "exp.num": "03 — Experiencia",
    "exp.title": "Mira más <em>cerca</em>",
    "exp.lede": "En esta obra hay cinco detalles escondidos. Mueve la lupa y encuéntralos.",
    "exp.found": "encontrados",
    "exp.empty": "Arrastra la lupa sobre la pintura.",
    "exp.done": "Los encontraste todos. Ya miraste como mira el artista.",
    "cmp.title": "De la línea <em>al color</em>",
    "cmp.lede": "Debajo de cada color hay una línea. Desliza para separar el dibujo de la pintura.",
    "cmp.pencil": "Línea", "cmp.color": "Color", "cmp.handle": "Comparar línea y color",
    "gal.title": "La <em>galería</em>", "gal.lede": "Cada obra se enciende cuando te detienes frente a ella.", "gal.color": "Color", "gal.pencil": "Lápiz", "gal.open": "Ver obra", "gal.prev": "Anterior", "gal.next": "Siguiente",

    "art.num": "04 — CARMINE ART",
    "art.title": "Arte que se <em>siente</em>",
    "art.lede": "Pintura, dibujo, poesía, música y símbolo en una sola experiencia. Esta obra también suena: cada color es una nota.",
    "art.play": "Escuchar la obra", "art.stop": "Detener",
    "art.tap": "O toca la pintura para oír un color.",
    "art.sound": "Sube el volumen. En iPhone, desactiva el modo silencio.",
    "art.s1": "Pinturas", "art.s2": "Dibujos a lápiz", "art.s3": "Poemas", "art.s4": "Música", "art.s5": "Simbolismo",

    "sport.num": "05 — CARMINE SPORT",
    "sport.title": "Arte que se <em>vive</em>",
    "sport.lede": "Historias deportivas convertidas en libros ilustrados. Aquí el lector no solo lee: participa.",
    "sport.p1": "Libros ilustrados", "sport.p1t": "Historias del deporte contadas con arte.",
    "sport.p2": "Contenido cultural", "sport.p2t": "El contexto detrás de cada jugada.",
    "sport.p3": "Para colorear", "sport.p3t": "Las ilustraciones originales, listas para terminar.",
    "sport.p4": "Actividades cognitivas", "sport.p4t": "Memoria, atención y lógica a través del juego.",
    "color.title": "Termina la obra", "color.lede": "Elige un color y toca una zona. Esta página es tuya.",
    "color.save": "Guardar mi página", "color.reset": "Empezar de nuevo",

    "col.num": "06 — Colecciones",
    "col.title": "Explora los <em>libros</em>",
    "col.lede": "Catálogo editorial: abre cada libro y mira sus páginas por dentro.",
    "col.all": "Todos", "col.art": "Art", "col.sport": "Sport",
    "col.open": "Ver por dentro",
    "book.buy": "Comprar", "book.notify": "Avísame cuando esté disponible",
    "book.inside": "Páginas de muestra", "book.swipe": "Desliza las páginas",
    "book.format": "Formato", "book.lang": "Idioma", "book.tbc": "Por confirmar",

    "con.num": "07 — Conexiones",
    "con.title": "Beyond the <em>Canvas</em>",
    "con.lede": "Exposiciones, proyectos y alianzas. Elige con quién quieres crear y mira qué se conecta.",
    "con.cta": "Proponer esta colaboración",
    "d.painting": "Pintura", "d.poetry": "Poesía", "d.music": "Música", "d.sport": "Deporte", "d.culture": "Cultura", "d.creativity": "Creatividad",

    "end.num": "08 — Cierre",
    "end.title": "El arte continúa <em>contigo</em>",
    "end.lede": "No querías solo mirar una obra. Te detuviste, encontraste detalles e hiciste algo propio. Esto es lo que te llevas.",
    "end.make": "Revelar mi postal", "end.save": "Guardar postal",
    "end.s.time": "mirando", "end.s.details": "detalles", "end.s.notes": "notas escuchadas", "end.s.colors": "colores usados",

    "form.title": "Hablemos",
    "form.t1": "Comprar libros", "form.t2": "Colaboración", "form.t3": "Otro",
    "form.name": "Nombre", "form.email": "Email", "form.msg": "Mensaje",
    "form.send": "Enviar",
    "form.note": "Formulario de muestra: falta conectar el correo de CARMINE.",
    "form.ok": "Abriendo tu correo…",

    "foot.tag": "Mira un minuto más.",
    "foot.rights": "© 2026 CARMINE. Todos los derechos reservados."
  },
  en: {
    "skip": "Skip to content",
    "nav.home": "Home", "nav.story": "Our Story", "nav.art": "Carmine Art", "nav.sport": "Carmine Sport",
    "nav.collections": "Collections", "nav.contact": "Contact", "nav.menu": "Menu", "nav.close": "Close",
    "minute.label": "Your minute",
    "minute.toast": "You looked one minute more.", "minute.toast2": "From now on, everything has color.",

    "hero.kicker": "CARMINE — Art · Poetry · Music · Sport",
    "hero.title": "Look one<br><em>minute more</em>",
    "hero.hint": "Press and hold on the artwork",
    "hero.hint2": "Color appears when you stop",
    "hero.scroll": "Scroll",

    "story.num": "02 — Our story",
    "story.title": "From a five-year-old drawing to a <em>universe of his own</em>.",
    "story.c1.k": "At five years old", "story.c1.t": "It all began with a pencil. Max Emiliano Dell Carmine was drawing before he knew what art was.",
    "story.c2.k": "Architecture", "story.c2.t": "Then came architecture: learning to see the structure, proportion and light behind every form.",
    "story.c3.k": "New York", "story.c3.t": "Life in New York gave that line a city, a rhythm and a stage.",
    "story.c4.k": "CARMINE", "story.c4.t": "And so CARMINE was born: an artistic and editorial universe of its own. <em>Monochrome on the outside. An explosion of color within.</em>",

    "exp.num": "03 — Experience",
    "exp.title": "Look <em>closer</em>",
    "exp.lede": "Five details are hidden in this work. Move the loupe and find them.",
    "exp.found": "found",
    "exp.empty": "Drag the loupe across the painting.",
    "exp.done": "You found them all. Now you've looked the way the artist looks.",
    "cmp.title": "From line <em>to color</em>",
    "cmp.lede": "Beneath every color there is a line. Slide to pull the drawing away from the painting.",
    "cmp.pencil": "Line", "cmp.color": "Color", "cmp.handle": "Compare line and color",
    "gal.title": "The <em>gallery</em>", "gal.lede": "Each work lights up when you stop in front of it.", "gal.color": "Color", "gal.pencil": "Pencil", "gal.open": "View work", "gal.prev": "Previous", "gal.next": "Next",

    "art.num": "04 — CARMINE ART",
    "art.title": "Art you can <em>feel</em>",
    "art.lede": "Painting, drawing, poetry, music and symbol in a single experience. This work also has a sound: every color is a note.",
    "art.play": "Listen to the work", "art.stop": "Stop",
    "art.tap": "Or tap the painting to hear a color.",
    "art.sound": "Turn up the volume. On iPhone, switch off silent mode.",
    "art.s1": "Paintings", "art.s2": "Pencil drawings", "art.s3": "Poems", "art.s4": "Music", "art.s5": "Symbolism",

    "sport.num": "05 — CARMINE SPORT",
    "sport.title": "Art you can <em>live</em>",
    "sport.lede": "Sports stories turned into illustrated books. Here the reader doesn't just read: they take part.",
    "sport.p1": "Illustrated books", "sport.p1t": "Sports stories told through art.",
    "sport.p2": "Cultural content", "sport.p2t": "The context behind every play.",
    "sport.p3": "Coloring pages", "sport.p3t": "The original illustrations, ready to finish.",
    "sport.p4": "Cognitive activities", "sport.p4t": "Memory, attention and logic through play.",
    "color.title": "Finish the artwork", "color.lede": "Pick a color and tap an area. This page is yours.",
    "color.save": "Save my page", "color.reset": "Start over",

    "col.num": "06 — Collections",
    "col.title": "Explore the <em>books</em>",
    "col.lede": "The editorial catalog: open each book and look at the pages inside.",
    "col.all": "All", "col.art": "Art", "col.sport": "Sport",
    "col.open": "Look inside",
    "book.buy": "Buy", "book.notify": "Notify me when available",
    "book.inside": "Sample pages", "book.swipe": "Swipe the pages",
    "book.format": "Format", "book.lang": "Language", "book.tbc": "To be confirmed",

    "con.num": "07 — Connections",
    "con.title": "Beyond the <em>Canvas</em>",
    "con.lede": "Exhibitions, projects and partnerships. Choose who you want to create with and see what connects.",
    "con.cta": "Propose this collaboration",
    "d.painting": "Painting", "d.poetry": "Poetry", "d.music": "Music", "d.sport": "Sport", "d.culture": "Culture", "d.creativity": "Creativity",

    "end.num": "08 — Closing",
    "end.title": "Art continues <em>with you</em>",
    "end.lede": "You didn't just look at a work. You stopped, found details and made something your own. This is what you take with you.",
    "end.make": "Reveal my postcard", "end.save": "Save postcard",
    "end.s.time": "looking", "end.s.details": "details", "end.s.notes": "notes heard", "end.s.colors": "colors used",

    "form.title": "Let's talk",
    "form.t1": "Buy books", "form.t2": "Collaboration", "form.t3": "Other",
    "form.name": "Name", "form.email": "Email", "form.msg": "Message",
    "form.send": "Send",
    "form.note": "Sample form: CARMINE's email still needs to be connected.",
    "form.ok": "Opening your email…",

    "foot.tag": "Look one minute more.",
    "foot.rights": "© 2026 CARMINE. All rights reserved."
  }
};
