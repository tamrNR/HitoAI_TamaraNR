import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FacultadService {
  private apiUrl = `${environment.apiUrl}/facultad`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ ID_Facultad: number; Nombre: string }[]> {
    return this.http.get<{ ID_Facultad: number; Nombre: string }[]>(this.apiUrl);
  }
}
