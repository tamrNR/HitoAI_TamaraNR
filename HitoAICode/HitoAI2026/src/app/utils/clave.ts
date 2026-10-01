export function claveSegura(clave: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?]).{8,}$/;
  return regex.test(clave);
}
