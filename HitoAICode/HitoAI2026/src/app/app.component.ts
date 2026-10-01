import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'HitoAI';

  constructor(public themeService: ThemeService) {}
}
