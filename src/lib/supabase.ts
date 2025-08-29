import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para TypeScript basados en nuestro esquema
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          business_id: string
          role: 'admin' | 'staff'
          name: string
          created_at: string
        }
        Insert: {
          id: string
          business_id: string
          role?: 'admin' | 'staff'
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          role?: 'admin' | 'staff'
          name?: string
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          business_id: string
          created_by: string
          name: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          created_by: string
          name: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          created_by?: string
          name?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          business_id: string
          name: string
          phone: string | null
          last_visit: string | null
          total_visits: number
          total_cancellations: number
          contact_method: 'whatsapp' | 'instagram' | 'phone' | null
          contact_handle: string | null
          notes: string | null
          reminder_sent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          phone?: string | null
          last_visit?: string | null
          total_visits?: number
          total_cancellations?: number
          contact_method?: 'whatsapp' | 'instagram' | 'phone' | null
          contact_handle?: string | null
          notes?: string | null
          reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          phone?: string | null
          last_visit?: string | null
          total_visits?: number
          total_cancellations?: number
          contact_method?: 'whatsapp' | 'instagram' | 'phone' | null
          contact_handle?: string | null
          notes?: string | null
          reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          created_by: string
          client_id: string | null
          service_id: string
          title: string | null
          start_date_time: string
          duration_min: number
          is_recurring: boolean
          rrule: any | null
          timezone: string | null
          notes: string | null
          status: 'pending' | 'done' | 'cancelled' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          created_by: string
          client_id?: string | null
          service_id: string
          title?: string | null
          start_date_time: string
          duration_min: number
          is_recurring?: boolean
          rrule?: any | null
          timezone?: string | null
          notes?: string | null
          status?: 'pending' | 'done' | 'cancelled' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          created_by?: string
          client_id?: string | null
          service_id?: string
          title?: string | null
          start_date_time?: string
          duration_min?: number
          is_recurring?: boolean
          rrule?: any | null
          timezone?: string | null
          notes?: string | null
          status?: 'pending' | 'done' | 'cancelled' | null
          created_at?: string
          updated_at?: string
        }
      }
      exceptions: {
        Row: {
          id: string
          business_id: string
          appointment_id: string
          original_date_time: string
          type: 'skip' | 'move'
          new_start_date_time: string | null
          new_duration_min: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          appointment_id: string
          original_date_time: string
          type: 'skip' | 'move'
          new_start_date_time?: string | null
          new_duration_min?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          appointment_id?: string
          original_date_time?: string
          type?: 'skip' | 'move'
          new_start_date_time?: string | null
          new_duration_min?: number | null
          created_at?: string
        }
      }
      client_history: {
        Row: {
          id: string
          business_id: string
          client_id: string
          event_type: 'visit_completed' | 'appointment_cancelled' | 'reminder_sent' | 'client_created'
          appointment_id: string | null
          timestamp: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id: string
          event_type: 'visit_completed' | 'appointment_cancelled' | 'reminder_sent' | 'client_created'
          appointment_id?: string | null
          timestamp?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string
          event_type?: 'visit_completed' | 'appointment_cancelled' | 'reminder_sent' | 'client_created'
          appointment_id?: string | null
          timestamp?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}