import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-home-profesor',
  standalone: true,
  imports: [RouterModule, SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor() {}
  ngOnInit() {}
}
