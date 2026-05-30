import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase-service';
import { Session, User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);

  readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this.session());

  private readonly _role = signal<string>('USER');
  readonly isAdmin = computed(() => this._role() === 'ADMIN');

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      this._loadRole(data.session?.user);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this._loadRole(session?.user);
    });
  }

  async login(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    this.router.navigate(['/tabs'], { replaceUrl: true });
  }

  async signUp(
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
  ): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });
    if (error) throw error;
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth'], { replaceUrl: true });
  }

  private async _loadRole(user: User | undefined | null): Promise<void> {
    if (!user) {
      this._role.set('USER');
      return;
    }
    const { data } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    this._role.set(data?.role || 'USER');
  }
}
