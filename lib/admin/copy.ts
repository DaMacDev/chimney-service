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
} as const;

export type AdminSectionSlug = keyof typeof adminCopy.sections;
