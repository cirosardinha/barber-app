import { AuthService } from './../../services/auth-service';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonContent, CommonModule, FormsModule],
})
export class AuthPage {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastController);

  readonly mode = signal<Mode>('login');

  readonly fullName = signal<string>('');
  readonly phoneNumber = signal<string>('');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  readonly touched = signal({
    fullName: false,
    phoneNumber: false,
    email: false,
    password: false,
  });

  readonly fullNameError = computed(() => {
    if (this.mode() === 'login') return '';
    if (!this.touched().fullName) return '';
    if (!this.fullName().trim() || this.fullName().length < 3)
      return 'Nome deve ter pelo menos 3 caracteres';
    return '';
  });

  readonly phoneNumberError = computed(() => {
    if (this.mode() === 'login') return '';
    if (!this.touched().phoneNumber) return '';
    if (!this.phoneNumber().trim() || this.phoneNumber().length < 10)
      return 'Telefone inválido';
    return '';
  });

  readonly emailError = computed(() => {
    if (!this.touched().email) return '';
    if (!this.email().trim()) return 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()))
      return 'E-mail inválido';
    return '';
  });

  readonly passwordError = computed(() => {
    if (!this.touched().password) return '';
    if (!this.password().trim()) return 'Senha é obrigatória';
    if (this.password().length < 6)
      return 'Senha deve ter pelo menos 6 caracteres';
    return '';
  });

  isRegister = computed(() => this.mode() === 'register');

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.touched.set({
      fullName: false,
      phoneNumber: false,
      email: false,
      password: false,
    });
  }

  touch(field: 'fullName' | 'phoneNumber' | 'email' | 'password'): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  async submit(): Promise<void> {
    this.touched.set({
      fullName: true,
      phoneNumber: true,
      email: true,
      password: true,
    });

    const hasError =
      this.emailError() ||
      this.passwordError() ||
      (this.isRegister() && (this.fullNameError() || this.phoneNumberError()));

    if (hasError) return;

    this.isLoading.set(true);

    try {
      if (this.isRegister()) {
        await this.authService.signUp(
          this.email(),
          this.password(),
          this.fullName(),
          this.phoneNumber(),
        );
        await this.showToast('Conta criada com sucesso! Bem-vindo!', 'success');
      } else {
        await this.authService.login(this.email(), this.password());
      }
    } catch (error: any) {
      const msg = this.friendlyError(error.message);
      await this.showToast(msg, 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  private friendlyError(msg: string): string {
    if (msg?.includes('Invalid login credentials'))
      return 'Email ou senha incorretos';
    if (msg?.includes('Email not confirmed'))
      return 'Confirme seu email antes de entrar';
    if (msg?.includes('User already registered'))
      return 'Este email já está cadastrado';
    return msg || 'Ocorreu um erro. Tente novamente.';
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toast.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
