import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';
import { formatDateWithPreposition } from 'src/app/shared/utils/date.utils';

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
    this.formattedDate = formatDateWithPreposition(this.date);

    if (!this.date || !this.time) {
      this.router.navigate(['/tabs/schedule'], { replaceUrl: true });
    }
  }

  goHome(): void {
    this.router.navigate(['/tabs/schedule'], { replaceUrl: true });
  }

  goAppointments(): void {
    this.router.navigate(['/tabs/my-appointments'], { replaceUrl: true });
  }
}
