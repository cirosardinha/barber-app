import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth-service';
import { ThemeService } from 'src/app/shared/services/theme-service';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ThemeBtnComponent } from 'src/app/shared/components/theme-btn/theme-btn.component';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner, ThemeBtnComponent],
})
export class AuthPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);
  readonly themeService = inject(ThemeService);

  readonly mode = signal<Mode>('login');
  readonly isRegister = computed(() => this.mode() === 'register');

  readonly fullName = signal('');
  readonly phoneNumber = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);

  readonly touched = signal({
    fullName: false,
    phoneNumber: false,
    email: false,
    password: false,
  });

  private _logoClicks = 0;
  private _logoTimer: any = null;

  constructor() {
    addIcons({ sunnyOutline, moonOutline });
  }

  readonly fullNameError = computed(() => {
    if (!this.isRegister() || !this.touched().fullName) return '';
    if (!this.fullName().trim()) return 'Nome é obrigatório';
    if (this.fullName().trim().length < 3) return 'Mínimo 3 letras';
    return '';
  });

  readonly phoneNumberError = computed(() => {
    if (!this.isRegister() || !this.touched().phoneNumber) return '';
    if (!this.phoneNumber().trim()) return 'Telefone é obrigatório';
    if (this.phoneNumber().trim().length < 10) return 'Telefone inválido';
    return '';
  });

  readonly emailError = computed(() => {
    if (!this.touched().email) return '';
    if (!this.email().trim()) return 'E-mail é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()))
      return 'E-mail inválido';
    return '';
  });

  readonly passwordError = computed(() => {
    if (!this.touched().password) return '';
    if (!this.password()) return 'Senha é obrigatória';
    if (this.isRegister() && this.password().length < 6)
      return 'Mínimo 6 caracteres';
    return '';
  });

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.touched.set({
      fullName: false,
      phoneNumber: false,
      email: false,
      password: false,
    });
  }

  touch(field: keyof ReturnType<typeof this.touched>): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  onLogoClick(): void {
    this._logoClicks++;
    clearTimeout(this._logoTimer);
    this._logoTimer = setTimeout(() => {
      this._logoClicks = 0;
    }, 2000);
    if (this._logoClicks >= 5) {
      this._logoClicks = 0;
      this.router.navigate(['/admin/login']);
    }
  }

  async submit(): Promise<void> {
    this.touched.set({
      fullName: true,
      phoneNumber: true,
      email: true,
      password: true,
    });
    if (
      this.fullNameError() ||
      this.phoneNumberError() ||
      this.emailError() ||
      this.passwordError()
    )
      return;

    this.isLoading.set(true);
    try {
      if (this.isRegister()) {
        await this.authService.signUp(
          this.email(),
          this.password(),
          this.fullName().trim(),
          this.phoneNumber().trim(),
        );
        this.showToast('Conta criada com sucesso!', 'success');
        this.setMode('login');
      } else {
        await this.authService.login(this.email(), this.password());
        this.router.navigate(['/tabs'], { replaceUrl: true });
      }
    } catch (err: any) {
      const msg = err?.message ?? '';
      this.showToast(this._translateError(msg));
    } finally {
      this.isLoading.set(false);
    }
  }

  private _translateError(msg: string): string {
    if (msg.includes('Invalid login credentials'))
      return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed'))
      return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('already registered'))
      return 'Este e-mail já está cadastrado.';
    return 'Erro inesperado. Tente novamente.';
  }

  private async showToast(message: string, color = 'danger'): Promise<void> {
    const toast = await this.toast.create({
      message,
      duration: 3500,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
