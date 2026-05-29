import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Appointment, TimeSlot } from '../models/appointment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly supabase = inject(SupabaseService).client;

  async getSlots(date: string): Promise<TimeSlot[]> {
    const { data, error } = await this.supabase.rpc('get_available_slots', {
      p_date: date,
    });
    if (error) throw error;
    return (data as any[]).map((row) => ({
      time: row.slot_time,
      available: row.available,
    }));
  }

  async getMyAppointments(): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    return data as Appointment[];
  }

  async create(date: string, time: string): Promise<Appointment> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const { data, error } = await this.supabase
      .from('appointments')
      .insert({ user_id: user.id, date, time })
      .select()
      .single();

    if (error) throw error;
    return data as Appointment;
  }

  async cancel(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('appointments')
      .update({ status: 'CANCELED' })
      .eq('id', id);
    if (error) throw error;
  }

  async getAll(): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*, profiles(full_name, phone_number)')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    return data as Appointment[];
  }

  async complete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('appointments')
      .update({ status: 'COMPLETED' })
      .eq('id', id);
    if (error) throw error;
  }
}
