import { Component } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-home-jefe-carrera',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor() {}
  ngOnInit() {}
}
