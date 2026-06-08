import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  ToastController,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, logOutOutline } from 'ionicons/icons';
import { AppointmentService } from 'src/app/services/appointment-service';
import { AuthService } from 'src/app/services/auth-service';
import { TimeSlot } from 'src/app/models/appointment';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';
import { formatDate } from 'src/app/shared/utils/date.utils';
import { ThemeBtnComponent } from 'src/app/shared/components/theme-btn/theme-btn.component';

interface DayOption {
  value: string;
  weekday: string;
  label: string;
  isSunday: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [
    IonRefresherContent,
    IonRefresher,
    CommonModule,
    FormatTimePipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonSpinner,
    IonModal,
    IonButtons,
    ThemeBtnComponent,
  ],
})
export class SchedulePage implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  readonly days = signal<DayOption[]>([]);
  readonly selectedDate = signal('');
  readonly disabledDays = signal<Set<string>>(new Set());
  readonly enabledSundays = signal<Set<string>>(new Set());
  readonly slots = signal<TimeSlot[]>([]);
  readonly selectedSlot = signal('');
  readonly isLoading = signal(false);
  readonly isConfirming = signal(false);
  readonly showConfirmModal = signal(false);

  readonly filteredSlots = computed(() => {
    const today = new Date();
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    const isToday =
      new Date(y, m - 1, d).toDateString() === today.toDateString();

    return this.slots().map((slot) => {
      if (isToday) {
        const [h, m] = slot.time.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(h, m, 0, 0);
        return slotTime <= today ? { ...slot, available: false } : slot;
      }
      return slot;
    });
  });

  readonly formattedSelectedDate = computed(() =>
    formatDate(this.selectedDate())
  );

  constructor() {
    addIcons({ logOutOutline, calendarOutline });
  }

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([this._loadDisabledDays(), this._loadEnabledSundays()]);
      this._buildDays();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async _loadEnabledSundays(): Promise<void> {
    try {
      const dates = await this.appointmentService.getEnabledSundays();
      this.enabledSundays.set(new Set(dates));
    } catch {}
  }

  private async _loadDisabledDays(): Promise<void> {
    try {
      const dates = await this.appointmentService.getDisabledDays();
      this.disabledDays.set(new Set(dates));
    } catch {}
  }

  private _buildDays(): void {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const days: DayOption[] = [];
    const today = new Date();
    const formatedToday = this._formatDate(today);

    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push({
        value: this._formatDate(day),
        weekday: weekdays[day.getDay()],
        label: String(day.getDate()),
        isSunday: day.getDay() === 0,
        isToday: this._formatDate(day) === formatedToday,
      });
    }
    this.days.set(days);
    const firstAvailable = days.find((d) => !this.isDayBlocked(d));
    if (firstAvailable) {
      this.selectDate(firstAvailable.value);
    } else {
      const fallback = days.find((d) => !d.isSunday);
      if (fallback) this.selectDate(fallback.value);
    }
  }

  isDayBlocked(day: DayOption): boolean {
    if (day.isSunday) return !this.enabledSundays().has(day.value);
    return this.disabledDays().has(day.value);
  }

  async selectDate(date: string): Promise<void> {
    const day = this.days().find((d) => d.value === date);
    if (day && this.isDayBlocked(day)) return;
    this.selectedDate.set(date);
    this.selectedSlot.set('');
    this.isLoading.set(true);
    try {
      this.slots.set(await this.appointmentService.getSlots(date));
    } catch {
      this.showToast('Erro ao carregar horários.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.available) return;
    this.selectedSlot.set(slot.time);
  }

  openConfirmModal(): void {
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
  }

  async confirm(): Promise<void> {
    if (!this.selectedSlot() || !this.selectedDate()) return;
    this.isConfirming.set(true);
    try {
      const appointment = await this.appointmentService.create(
        this.selectedDate(),
        this.selectedSlot()
      );
      this.closeConfirmModal();
      this.router.navigate(['/success'], {
        state: { date: appointment.date, time: appointment.time },
        replaceUrl: true,
      });
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('LIMIT_EXCEEDED')) {
        this.showToast('Você já tem 2 agendamentos ativos.');
      } else if (msg.includes('unique') || msg.includes('duplicate')) {
        this.showToast('Horário ocupado. Escolha outro.');
        await this.selectDate(this.selectedDate());
      } else {
        this.showToast('Erro ao agendar. Tente novamente.');
      }
      this.closeConfirmModal();
    } finally {
      this.isConfirming.set(false);
    }
  }

  async handleRefresh(event: any): Promise<void> {
    await this._loadDisabledDays();
    await this._loadEnabledSundays();
    event.target.complete();
  }

  isPastDay(day: DayOption): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, date] = day.value.split('-').map(Number);
    const selected = new Date(year, month - 1, date);

    return selected < today;
  }

  async logout(): Promise<void> {
    this.router.navigate(['/auth'], { replaceUrl: true });
    await this.authService.logout();
  }

  private _formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 3500,
      position: 'bottom',
      color: 'danger',
    });
    await t.present();
  }
}
