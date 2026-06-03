import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSpinner,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  ToastController,
} from '@ionic/angular/standalone';
import { AppointmentService } from 'src/app/services/appointment-service';
import { AuthService } from 'src/app/services/auth-service';
import { Appointment } from 'src/app/models/appointment';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';
import { FormatDatePipe } from 'src/app/shared/pipes/format-date.pipe';
import { Router } from '@angular/router';
import { ThemeBtnComponent } from 'src/app/shared/components/theme-btn/theme-btn.component';

type Filter = 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'ALL';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormatTimePipe,
    FormatDatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSpinner,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    ThemeBtnComponent,
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
  readonly disabledDays = signal<string[]>([]);
  readonly enabledSundays = signal<string[]>([]);
  readonly showDisablePicker = signal(false);
  readonly disableDate = signal('');
  readonly isTogglingDay = signal(false);
  readonly currentPage = signal(1);
  readonly appointmentToCancel = signal<Appointment | null>(null);
  readonly isCanceling = signal(false);

  readonly today = new Date().toISOString().split('T')[0];

  readonly filtered = computed(() => {
    const f = this.filter();
    if (f === 'ALL') return this.appointments();
    return this.appointments().filter((a) => a.status === f);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  readonly paginatedAppointments = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  readonly scheduledCount = computed(
    () => this.appointments().filter((a) => a.status === 'SCHEDULED').length,
  );

  setFilter(f: Filter): void {
    this.filter.set(f);
    this.currentPage.set(1);
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadDisabledDays(), this.loadEnabledSundays()]);
  }

  async handleRefresh(event: any): Promise<void> {
    await Promise.all([this.load(), this.loadDisabledDays(), this.loadEnabledSundays()]);
    event.target.complete();
  }

  async loadDisabledDays(): Promise<void> {
    try {
      this.disabledDays.set(await this.appointmentService.getDisabledDays());
    } catch {
      this.showToast('Erro ao carregar dias desabilitados.');
    }
  }

  async loadEnabledSundays(): Promise<void> {
    try {
      this.enabledSundays.set(await this.appointmentService.getEnabledSundays());
    } catch {
      this.showToast('Erro ao carregar domingos habilitados.');
    }
  }

  isDisabled(date: string): boolean {
    return this.disabledDays().includes(date);
  }

  isSunday(date: string): boolean {
    if (!date) return false;
    return new Date(date + 'T00:00:00').getDay() === 0;
  }

  isSundayEnabled(date: string): boolean {
    return this.enabledSundays().includes(date);
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
      if (this.isSunday(date)) {
        if (this.isSundayEnabled(date)) {
          await this.appointmentService.disableSunday(date);
          this.enabledSundays.update((d) => d.filter((x) => x !== date));
          this.showToast('Domingo desabilitado.', 'success');
        } else {
          await this.appointmentService.enableSunday(date);
          this.enabledSundays.update((d) => [...d, date]);
          this.showToast('Domingo habilitado.', 'success');
        }
      } else {
        if (this.isDisabled(date)) {
          await this.appointmentService.enableDay(date);
          this.disabledDays.update((d) => d.filter((x) => x !== date));
          this.showToast('Dia reabilitado.', 'success');
        } else {
          await this.appointmentService.disableDay(date);
          this.disabledDays.update((d) => [...d, date]);
          this.showToast('Dia desabilitado.', 'success');
        }
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

  openCancelConfirm(a: Appointment): void {
    this.appointmentToCancel.set(a);
  }

  closeCancelConfirm(): void {
    this.appointmentToCancel.set(null);
  }

  async confirmCancel(): Promise<void> {
    const a = this.appointmentToCancel();
    if (!a) return;
    this.isCanceling.set(true);
    try {
      await this.appointmentService.cancel(a.id);
      this.appointments.update((list) =>
        list.map((x) =>
          x.id === a.id ? { ...x, status: 'CANCELED' as const } : x,
        ),
      );
      this.closeCancelConfirm();
    } catch {
      this.showToast('Erro ao cancelar.');
    } finally {
      this.isCanceling.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.router.navigate(['/admin/login'], { replaceUrl: true });
    await this.authService.logout();
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
