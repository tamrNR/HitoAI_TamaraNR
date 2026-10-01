import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  rolUsuario = localStorage.getItem('rol') || '';
  constructor() {}
  ngOnInit() {}
}
