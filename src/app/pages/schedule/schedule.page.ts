import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
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
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AppointmentService } from 'src/app/services/appointment-service';
import { AuthService } from 'src/app/services/auth-service';
import { TimeSlot } from 'src/app/models/appointment';
import { FormatTimePipe } from 'src/app/shared/pipes/format-time.pipe';

interface DayOption {
  value: string;
  weekday: string;
  label: string;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
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
    IonIcon,
    IonSpinner,
    IonModal,
  ],
})
export class SchedulePage implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  readonly days = signal<DayOption[]>([]);
  readonly selectedDate = signal('');
  readonly slots = signal<TimeSlot[]>([]);
  readonly selectedSlot = signal('');
  readonly isLoading = signal(false);
  readonly isConfirming = signal(false);
  readonly showConfirmModal = signal(false);

  readonly filteredSlots = computed(() => {
    const today = new Date();
    const isToday = this.selectedDate() === this._formatDate(today);
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

  readonly formattedSelectedDate = computed(() => {
    const d = this.selectedDate();
    if (!d) return '';
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
    const [year, month, day] = d.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${weekdays[date.getDay()]}, ${day} ${months[month - 1]}`;
  });

  constructor() {
    addIcons({ logOutOutline });
  }

  ngOnInit(): void {
    this._buildDays();
  }

  private _buildDays(): void {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const days: DayOption[] = [];
    const today = new Date();
    let added = 0,
      offset = 0;
    while (added < 7) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset++);
      if (d.getDay() === 0) continue;
      days.push({
        value: this._formatDate(d),
        weekday: weekdays[d.getDay()],
        label: String(d.getDate()),
      });
      added++;
    }
    this.days.set(days);
    this.selectDate(days[0].value);
  }

  async selectDate(date: string): Promise<void> {
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
        this.selectedSlot(),
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

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/auth'], { replaceUrl: true });
  }

  private _formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
