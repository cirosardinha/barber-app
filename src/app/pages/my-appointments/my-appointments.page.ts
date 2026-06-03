import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AppointmentService } from 'src/app/services/appointment-service';
import { AuthService } from 'src/app/services/auth-service';
import { Appointment } from 'src/app/models/appointment';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { Router } from '@angular/router';
import { ThemeBtnComponent } from 'src/app/shared/components/theme-btn/theme-btn.component';

@Component({
  selector: 'app-my-appointments',
  templateUrl: './my-appointments.page.html',
  styleUrls: ['./my-appointments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormatTimePipe,
    FormatDatePipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    ThemeBtnComponent,
  ],
})
export class MyAppointmentsPage implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastController);
  private readonly router = inject(Router);

  readonly appointments = signal<Appointment[]>([]);
  readonly isLoading = signal(false);
  readonly appointmentToCancel = signal<Appointment | null>(null);
  readonly isCancelling = signal(false);

  readonly scheduled = computed(() =>
    this.appointments().filter((a) => a.status === 'SCHEDULED'),
  );
  readonly past = computed(() =>
    this.appointments().filter((a) => a.status !== 'SCHEDULED'),
  );

  constructor() {
    addIcons({ logOutOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.appointments.set(await this.appointmentService.getMyAppointments());
    } catch {
      this.showToast('Erro ao carregar agendamentos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleRefresh(event: any): Promise<void> {
    await this.load();
    event.target.complete();
  }

  openCancel(a: Appointment): void {
    this.appointmentToCancel.set(a);
  }

  closeCancel(): void {
    this.appointmentToCancel.set(null);
  }

  async confirmCancel(): Promise<void> {
    const a = this.appointmentToCancel();
    if (!a) return;
    this.isCancelling.set(true);
    try {
      await this.appointmentService.cancel(a.id);
      this.appointments.update((list) =>
        list.map((x) =>
          x.id === a.id ? { ...x, status: 'CANCELED' as const } : x,
        ),
      );
      this.closeCancel();
      this.showToast('Agendamento cancelado.', 'success');
    } catch {
      this.showToast('Erro ao cancelar.');
    } finally {
      this.isCancelling.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.router.navigate(['/auth'], { replaceUrl: true });
    await this.authService.logout();
  }

  private async showToast(message: string, color = 'danger'): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await t.present();
  }
}
