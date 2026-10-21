/**
 * /admin copy. The owner's tool is Spanish-only and lives outside the EN/ES
 * locale routes, so its strings sit here instead of messages/*.json (which must
 * stay in EN/ES parity).
 */
export const adminCopy = {
  title: "Administración de galería",
  signIn: "Iniciar sesión con Google",
  signInIntro: "Acceso solo para el propietario. Inicia sesión con tu cuenta de Google autorizada.",
  errorDenied: "Esta cuenta de Google no tiene acceso. Usa la cuenta autorizada.",
  errorFailed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
  signedInAs: "Sesión iniciada como",
  signOut: "Cerrar sesión",
  viewSite: "Ver galería pública",
  back: "Volver",

  overviewRegion: "Resumen de la galería",
  storageUsed: "Espacio usado",
  uploadsToday: "Archivos subidos hoy",
  usageNote:
    "Límites para no salir del plan gratuito. Si se alcanzan, borra contenido antiguo o espera al día siguiente.",
  sections: {
    carrusel: {
      title: "Carrusel de fotos",
      hint: "Fotos que se muestran una a una en la galería y en la página de inicio.",
      accept: "image/*",
    },
    ejemplos: {
      title: "Ejemplos de limpieza",
      hint: "Fotos y videos del interior de ductos, mostrados en mosaico.",
      accept: "image/*,video/mp4,video/webm,video/quicktime,.mov",
    },
  },
  itemCount: (n: number) => (n === 1 ? "1 elemento" : `${n} elementos`),

  addTitle: "Agregar foto o video",
  fileLabel: "Archivo",
  fileHelp: "Fotos: se reducen automáticamente. Videos: máximo 50 MB.",
  name: "Nombre",
  caption: "Leyenda",
  description: "Descripción",
  optional: "opcional",
  englishToggle: "Agregar textos en inglés (opcional)",
  englishSuffix: "en inglés",
  upload: "Subir",
  chooseFile: "Elige un archivo primero.",
  preparing: "Preparando archivo…",
  uploading: "Subiendo…",
  saving: "Guardando…",
  uploaded: "Listo: ya aparece en la galería.",

  listRegion: "Elementos de la sección",
  emptyTitle: "Esta sección está vacía",
  emptyBody: "Agrega la primera foto o video con el formulario.",
  edit: "Editar",
  save: "Guardar",
  cancel: "Cancelar",
  saved: "Cambios guardados.",
  moreActions: "Más acciones",
  moveUp: "Subir posición",
  moveDown: "Bajar posición",
  remove: "Borrar",
  confirmRemove: "¿Borrar este elemento de la galería? No se puede deshacer.",
  untitled: "Sin título",
  video: "Video",
  genericError: "Algo salió mal. Inténtalo de nuevo.",
  uploadFailed: "No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.",
  loading: "Cargando…",
  loadError: "No se pudo cargar la galería. Revisa tu conexión e inténtalo de nuevo.",
  retry: "Reintentar",
  movedTo: (position: number) => `Movido a la posición ${position}.`,
  removed: "Elemento borrado.",

  errors: {
    denied: "Tu sesión expiró. Vuelve a iniciar sesión.",
    conflict: "Otro cambio se guardó mientras tanto. Recarga la página e inténtalo de nuevo.",
    notFound: "Este elemento ya no existe. Recarga la página.",
    invalidData: "Los datos no son válidos.",
    invalidRequest: "Petición no válida.",
    carouselPhotosOnly: "El carrusel solo admite fotos.",
    invalidType: "Tipo de archivo no válido.",
    notUploaded: "El archivo no terminó de subirse. Inténtalo de nuevo.",
    missingPoster: "Falta la imagen de portada del video.",
    tooLong: (max: number) => `Máximo ${max} caracteres.`,
    needSpanish: "Escribe también el texto en español.",
    typeNotAllowed: "Tipo de archivo no permitido. Usa fotos JPG o PNG, o videos MP4, WebM o MOV.",
    invalidFile: "Archivo inválido.",
    emptyFile: "Archivo vacío o inválido.",
    photoTooBig: "La foto pesa más de 10 MB.",
    videoTooBig:
      "El video pesa más de 50 MB. Acórtalo o envíalo por WhatsApp para comprimirlo y vuelve a intentarlo.",
    dailyLimit: (max: number) => `Límite diario alcanzado (${max} archivos). Inténtalo mañana.`,
    storageFull:
      "Se alcanzó el espacio máximo (5 GB). Borra fotos o videos antiguos para subir más.",
    unreadablePhoto: "No se pudo leer la foto. Prueba con un JPG o PNG.",
    unplayableVideo:
      "Este navegador no puede reproducir el video. Grábalo en formato «Más compatible» o envíalo por WhatsApp y vuelve a intentarlo.",
  },
} as const;

export type AdminSectionSlug = keyof typeof adminCopy.sections;
