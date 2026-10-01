import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const userRol = localStorage.getItem('rol');
    const targetUrl = state.url;
    
    console.log('=== [AuthGuard] Verificando acceso ===');
    console.log('[AuthGuard] URL solicitada:', targetUrl);
    console.log('[AuthGuard] Rol del usuario:', userRol);
    console.log('[AuthGuard] Rol requerido por la ruta:', route.data['role']);
    
    // Si no hay usuario logueado, redirigir a login
    if (!userRol) {
      console.log('[AuthGuard] ❌ Usuario no autenticado, redirigiendo a login');
      return this.router.parseUrl('/login');
    }

    // Si la ruta requiere un rol específico, validarlo
    const requiredRole = route.data['role'];
    if (requiredRole) {
      const userRolNormalizado = userRol.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Soportar tanto string único como array de roles permitidos
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const allowedRolesNormalized = allowedRoles.map(r => r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      
      const hasAccess = allowedRolesNormalized.includes(userRolNormalizado);
      
      if (!hasAccess) {
        console.warn(`[AuthGuard] ⚠️ Rol no permitido para esta ruta. Usuario: ${userRol}, Permitidos: ${allowedRoles.join(', ')}`);
        
        // Redirigir al home del rol actual del usuario, NO al login
        const userHome = this.getUserHome(userRol);
        console.log(`[AuthGuard] Redirigiendo al home del usuario: ${userHome}`);
        return this.router.parseUrl(userHome);
      }
    }

    // Usuario autenticado y rol válido
    console.log('[AuthGuard] ✅ Acceso permitido');
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
      default:
        console.warn(`[AuthGuard] Rol desconocido: ${rol}. Redirigiendo a login.`);
        return '/login';
    }
  }
}
