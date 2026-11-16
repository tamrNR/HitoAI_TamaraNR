import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Adjunta "Authorization: Bearer <token>" a todas las peticiones y
// cierra sesión local cuando el backend responde 401 (token expirado/inválido)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/login')) {
        localStorage.clear();
        inject(Router).navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
