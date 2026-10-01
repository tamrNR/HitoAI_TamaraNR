import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

import { DialogRaComponent } from '../dialog-ra/dialog-ra.component';
import { DialogCompetenciaComponent } from '../dialog-competencia/dialog-competencia.component';

import { RaService } from '../../../services/ra.service';
import { AsignaturaService } from '../../../services/asignatura.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-ra',
  standalone: true,
  templateUrl: './ra-main.component.html',
  styleUrls: ['./ra-main.component.css'],
  imports: [CommonModule, NgbModalModule, SidebarComponent],
})
export class MainRaComponent implements OnInit {
  resultados: any[] = [];
  agrupadosPorAsignatura: any[] = [];
  rolUsuario: string = '';

  constructor(
    private raService: RaService,
    private asignaturaService: AsignaturaService,
    private modalService: NgbModal,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarRA();
  }

  cargarRA() {
    const rut = localStorage.getItem('rut') || '';
    const rolNorm = this.rolUsuario.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const esAdmin = rolNorm === 'administrador';
    const esComite = rolNorm === 'comite curricular';

    if (!rut && !esComite && !esAdmin) return;

    this.raService.obtenerTodos().subscribe({
      next: (data) => {
        const obtenerAsignaturas = (esComite || esAdmin)
          ? this.asignaturaService.obtenerTodas()
          : this.asignaturaService.obtenerPorCarreraDelJefe(rut);

        obtenerAsignaturas.subscribe({
          next: (listaAsignaturas) => {
            const mapa = new Map<string, any>();

            for (let ra of data) {
              const idAsig = ra.asignatura_ID_Asignatura;
              const asig = listaAsignaturas.find((a) => a.ID_Asignatura === idAsig);

              if (!asig) continue;

              if (!mapa.has(idAsig)) {
                mapa.set(idAsig, {
                  asignatura: idAsig,
                  nombreAsignatura: asig.Nombre,
                  ras: [],
                });
              }

              mapa.get(idAsig).ras.push(ra);
            }

            this.agrupadosPorAsignatura = Array.from(mapa.values());
          },
          error: (error) => {
            console.error('[MainRA] Error al cargar asignaturas:', error);
            this.agrupadosPorAsignatura = [];
          }
        });
      },
      error: (error) => {
        console.error('[MainRA] Error al cargar resultados de aprendizaje:', error);
        this.resultados = [];
        this.agrupadosPorAsignatura = [];
      }
    });
  }

  private elementoActivoAntesModal: HTMLElement | null = null;

  abrirDialog(modo: 'crear' | 'ver' | 'editar', ra?: any) {
    // Guardar el elemento activo antes de abrir el modal
    this.elementoActivoAntesModal = document.activeElement as HTMLElement;
    
    // Quitar el foco del botón que abre el modal
    this.elementoActivoAntesModal?.blur();

    const modalRef = this.modalService.open(DialogRaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = modo;
    modalRef.componentInstance.datos = modo === 'crear' ? null : ra;

    // Mover el foco dentro del modal cuando se abre
    setTimeout(() => {
      const modalElement = document.querySelector('.modal-content') as HTMLElement;
      if (modalElement) {
        const focusableElement = modalElement.querySelector('input, button, select, textarea') as HTMLElement;
        focusableElement?.focus();
      }
    }, 100);

    modalRef.result.then(
      (res) => {
        if (res === 'actualizado') this.cargarRA();
        // Devolver el foco al elemento activo antes de abrir el modal
        this.elementoActivoAntesModal?.focus();
      },
      () => {
        // Devolver el foco al elemento activo antes de abrir el modal (cuando se cierra con dismiss)
        this.elementoActivoAntesModal?.focus();
      }
    );
  }

  abrirDialogCompetencias() {
    const modalRef = this.modalService.open(DialogCompetenciaComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      injector: this.viewContainerRef.injector,
    });

    modalRef.result.then((res) => {
      if (res === 'actualizado') this.cargarRA();
    });
  }
}
