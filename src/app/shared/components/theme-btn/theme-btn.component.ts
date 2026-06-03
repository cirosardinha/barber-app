import { Component, inject } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { ThemeService } from '../../services/theme-service';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-theme-btn',
  templateUrl: './theme-btn.component.html',
  styleUrls: ['./theme-btn.component.scss'],
  imports: [IonButton, IonIcon],
})
export class ThemeBtnComponent {
  readonly themeService = inject(ThemeService);

  constructor() {
    addIcons({
      sunnyOutline,
      moonOutline,
    });
  }
}
