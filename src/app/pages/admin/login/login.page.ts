import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth-service';
import { ThemeBtnComponent } from '../../../shared/components/theme-btn/theme-btn.component';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner, ThemeBtnComponent],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  readonly email = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly touched = signal({ email: false, password: false });

  readonly emailError = computed(() => {
    if (!this.touched().email) return '';
    if (!this.email()) return 'E-mail é obrigatório';
    return '';
  });

  readonly passwordError = computed(() => {
    if (!this.touched().password) return '';
    if (!this.password()) return 'Senha é obrigatória';
    return '';
  });

  touch(field: 'email' | 'password'): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  async login(): Promise<void> {
    this.touched.set({ email: true, password: true });
    if (this.emailError() || this.passwordError()) return;

    this.isLoading.set(true);
    try {
      await this.authService.login(this.email(), this.password());
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
      } else {
        this.showToast('Acesso negado. Você não é um administrador.');
        await this.authService.logout();
        await this.router.navigate(['/admin/login'], { replaceUrl: true });
      }
    } catch (err: any) {
      const msg = err?.message ?? '';
      this.showToast(
        msg.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos.'
          : 'Erro ao entrar.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/auth']);
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 3500,
      position: 'top',
      color: 'danger',
    });
    await t.present();
  }
}
