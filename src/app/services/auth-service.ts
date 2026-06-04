import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Session, User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this.session());

  private readonly _role = signal<string>('USER');
  readonly isAdmin = computed(() => this._role() === 'ADMIN');

  private initPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const { data } = await this.supabase.auth.getSession();
      await this._loadRole(data.session?.user);
      this.session.set(data.session);

      this.supabase.auth.onAuthStateChange(async (_event, session) => {
        await this._loadRole(session?.user);
        this.session.set(session);
      });
    })();

    return this.initPromise;
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async signUp(
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string
  ): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone_number: phoneNumber },
      },
    });
    if (error) throw error;
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  private async _loadRole(user: User | undefined | null): Promise<void> {
    if (!user) {
      this._role.set('USER');
      return;
    }
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      this._role.set(data?.role || 'USER');
    } catch {
      this._role.set('USER');
    }
  }
}
