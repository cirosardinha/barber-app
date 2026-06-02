import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSpinner,
  IonBadge,
  IonModal,
  ToastController,
} from '@ionic/angular/standalone';
import { AppointmentService } from 'src/app/services/appointment-service';
import { AuthService } from 'src/app/services/auth-service';
import { Appointment } from 'src/app/models/appointment';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';
import { Router } from '@angular/router';

type Filter = 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'ALL';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormatTimePipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSpinner,
    IonBadge,
    IonModal,
  ],
})
export class DashboardPage implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastController);
  private readonly router = inject(Router);

  readonly appointments = signal<Appointment[]>([]);
  readonly isLoading = signal(false);
  readonly filter = signal<Filter>('SCHEDULED');
  readonly newCount = signal(0);
  readonly disabledDays = signal<string[]>([]);
  readonly showDisablePicker = signal(false);
  readonly disableDate = signal('');
  readonly isTogglingDay = signal(false);

  readonly filtered = computed(() => {
    const f = this.filter();
    if (f === 'ALL') return this.appointments();
    return this.appointments().filter((a) => a.status === f);
  });

  readonly scheduledCount = computed(
    () => this.appointments().filter((a) => a.status === 'SCHEDULED').length,
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadDisabledDays()]);
  }

  async loadDisabledDays(): Promise<void> {
    try {
      this.disabledDays.set(await this.appointmentService.getDisabledDays());
    } catch {
      this.showToast('Erro ao carregar dias desabilitados.');
    }
  }

  isDisabled(date: string): boolean {
    return this.disabledDays().includes(date);
  }

  openDisablePicker(): void {
    this.disableDate.set('');
    this.showDisablePicker.set(true);
  }

  closeDisablePicker(): void {
    this.showDisablePicker.set(false);
  }

  async toggleDay(date: string): Promise<void> {
    if (!date) return;
    this.isTogglingDay.set(true);
    try {
      if (this.isDisabled(date)) {
        await this.appointmentService.enableDay(date);
        this.disabledDays.update((d) => d.filter((x) => x !== date));
        this.showToast('Dia reabilitado.', 'success');
      } else {
        await this.appointmentService.disableDay(date);
        this.disabledDays.update((d) => [...d, date]);
        this.showToast('Dia desabilitado.', 'success');
      }
    } catch {
      this.showToast('Erro ao atualizar dia.');
    } finally {
      this.isTogglingDay.set(false);
      this.closeDisablePicker();
    }
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.appointments.set(await this.appointmentService.getAll());
    } catch {
      this.showToast('Erro ao carregar agendamentos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async complete(a: Appointment): Promise<void> {
    try {
      await this.appointmentService.complete(a.id);
      this.appointments.update((list) =>
        list.map((x) =>
          x.id === a.id ? { ...x, status: 'COMPLETED' as const } : x,
        ),
      );
    } catch {
      this.showToast('Erro ao atualizar.');
    }
  }

  async cancel(a: Appointment): Promise<void> {
    try {
      await this.appointmentService.cancel(a.id);
      this.appointments.update((list) =>
        list.map((x) => (x.id === a.id ? { ...x, status: 'CANCELED' } : x)),
      );
    } catch {
      this.showToast('Erro ao cancelar.');
    }
  }

  clearNewCount(): void {
    this.newCount.set(0);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/admin/login'], { replaceUrl: true });
  }

  formatDate(date: string): string {
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
    return `${weekdays[d.getDay()]}, ${day} ${months[month - 1]}`;
  }

  private async showToast(message: string, color = 'danger'): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await t.present();
  }
}
