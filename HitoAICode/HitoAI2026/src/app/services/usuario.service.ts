import { Injectable } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment'; // ✅ añadido

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuario`; // ✅ modificado

  constructor(private http: HttpClient) {}

  crearUsuario(usuario: Usuario) {
    return this.http.post(`${this.apiUrl}/crear`, usuario);
  }

  login(data: Pick<Usuario, 'ID_Usuario' | 'Clave'>) {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, data);
  }

  getJefesCarrera() {
    return this.http.get<Usuario[]>(`${this.apiUrl}/jefes`);
  }

  getProfesores() {
    return this.http.get<Usuario[]>(`${this.apiUrl}/profesores`);
  }

  getUsuarios() {
    return this.http.get<Usuario[]>(`${this.apiUrl}/todos`);
  }

  actualizarClave(id: string, clave: string) {
    return this.http.put(`${this.apiUrl}/clave/${id}`, { clave });
  }

  actualizarRol(id: string, rolId: string) {
    return this.http.put(`${this.apiUrl}/rol/${id}`, { rolId });
  }

  eliminar(id: string) {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}
