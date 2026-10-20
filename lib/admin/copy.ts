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
  mediaRegion: "Medios de la galería",
  emptyTitle: "Aún no hay herramientas de medios",
  emptyBody: "Pronto podrás subir, editar y ordenar fotos y videos de la galería desde aquí.",
} as const;
