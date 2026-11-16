import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  private tokenExpirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !payload.exp || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('rol');
    const targetUrl = state.url;

    // Sin token válido -> login (el token es la sesión real)
    if (!token || this.tokenExpirado(token) || !userRol) {
      localStorage.removeItem('token');
      return this.router.parseUrl('/login');
    }

    // Si la ruta requiere un rol específico, validarlo
    const requiredRole = route.data['role'];
    if (requiredRole) {
      const userRolNormalizado = userRol.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // Soportar tanto string único como array de roles permitidos
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const allowedRolesNormalized = allowedRoles.map(r => String(r).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

      const hasAccess = allowedRolesNormalized.includes(userRolNormalizado);

      if (!hasAccess) {
        console.warn(`[AuthGuard] Rol no permitido. Usuario: ${userRol}, Permitidos: ${allowedRoles.join(', ')}`);
        const userHome = this.getUserHome(userRol);
        return this.router.parseUrl(userHome);
      }
    }

    return true;
  }

  /**
   * Obtiene la ruta home según el rol del usuario
   */
  private getUserHome(rol: string): string {
    const rolNormalizado = rol.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    switch (rolNormalizado) {
      case 'administrador':
        return '/admin';
      case 'jefe de carrera':
        return '/jefe-carrera';
      case 'profesor':
        return '/profesor';
      case 'comite curricular':
        return '/comite';
      case 'decano':
        return '/decano';
      default:
        return '/login';
    }
  }
}
