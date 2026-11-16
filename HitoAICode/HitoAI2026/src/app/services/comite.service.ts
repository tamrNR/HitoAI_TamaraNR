import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComiteService {
  private apiUrl = `${environment.apiUrl}/comite`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const userRole = localStorage.getItem('rol') || '';
    return new HttpHeaders({ 'X-User-Role': userRole });
  }

  getDashboard(carrera?: number | null, plan?: number | null): Observable<any> {
    let params = new HttpParams();
    if (carrera != null && !Number.isNaN(Number(carrera))) {
      params = params.set('carrera', String(carrera));
    }
    if (plan != null && !Number.isNaN(Number(plan))) {
      params = params.set('plan', String(plan));
    }
    return this.http.get<any>(`${this.apiUrl}/dashboard`, {
      params,
      headers: this.getAuthHeaders()
    });
  }
}
