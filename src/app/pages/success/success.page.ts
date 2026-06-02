import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';

@Component({
  selector: 'app-success',
  templateUrl: './success.page.html',
  styleUrls: ['./success.page.scss'],
  standalone: true,
  imports: [CommonModule, FormatTimePipe, IonContent],
})
export class SuccessPage implements OnInit {
  private readonly router = inject(Router);

  date = '';
  time = '';
  formattedDate = '';

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;

    this.date = state?.['date'] ?? '';
    this.time = state?.['time'] ?? '';
    this.formattedDate = this._formatDate(this.date);
  }

  goHome(): void {
    this.router.navigate(['/tabs/schedule'], { replaceUrl: true });
  }

  goAppointments(): void {
    this.router.navigate(['/tabs/my-appointments'], { replaceUrl: true });
  }

  private _formatDate(date: string): string {
    if (!date) return '';
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return `${weekdays[d.getDay()]}, ${day} de ${months[month - 1]}`;
  }
}
