export interface Appointment {
  id: string;
  user_id: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'CANCELED' | 'COMPLETED';
  created_at: string;
  profiles?: {
    full_name: string | null;
    phone_number: string | null;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
