/** Un solo formato de correo: sin espacios y en minúsculas. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function esMismoEmail(a: string, b: string): boolean {
  return normalizarEmail(a) === normalizarEmail(b);
}
