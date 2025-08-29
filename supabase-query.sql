-- Esquema completo para Studio Maker en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de negocios/organizaciones
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de usuarios extendida (complementa auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    business_id uuid REFERENCES public.businesses ON DELETE CASCADE NOT NULL,
    role text CHECK (role IN ('admin', 'staff')) NOT NULL DEFAULT 'staff',
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Servicios
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses ON DELETE CASCADE NOT NULL,
    created_by uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    price integer NOT NULL, -- precio en centavos para evitar problemas de float
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    phone text,
    last_visit timestamp with time zone,
    total_visits integer DEFAULT 0 NOT NULL,
    total_cancellations integer DEFAULT 0 NOT NULL,
    contact_method text CHECK (contact_method IN ('whatsapp', 'instagram', 'phone')),
    contact_handle text,
    notes text,
    reminder_sent timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Citas/Turnos
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses ON DELETE CASCADE NOT NULL,
    created_by uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES public.clients ON DELETE SET NULL,
    service_id uuid REFERENCES public.services ON DELETE CASCADE NOT NULL,
    title text,
    start_date_time timestamp with time zone NOT NULL,
    duration_min integer NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    rrule jsonb, -- almacenar reglas de recurrencia como JSON
    timezone text DEFAULT 'America/Argentina/Buenos_Aires',
    notes text,
    status text CHECK (status IN ('pending', 'done', 'cancelled')) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Excepciones para citas recurrentes
CREATE TABLE IF NOT EXISTS public.exceptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses ON DELETE CASCADE NOT NULL,
    appointment_id uuid REFERENCES public.appointments ON DELETE CASCADE NOT NULL,
    original_date_time timestamp with time zone NOT NULL,
    type text CHECK (type IN ('skip', 'move')) NOT NULL,
    new_start_date_time timestamp with time zone,
    new_duration_min integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Historial de clientes
CREATE TABLE IF NOT EXISTS public.client_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses ON DELETE CASCADE NOT NULL,
    client_id uuid REFERENCES public.clients ON DELETE CASCADE NOT NULL,
    event_type text CHECK (event_type IN ('visit_completed', 'appointment_cancelled', 'reminder_sent', 'client_created')) NOT NULL,
    appointment_id uuid REFERENCES public.appointments ON DELETE SET NULL,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_services_business_created_by ON public.services(business_id, created_by);
CREATE INDEX IF NOT EXISTS idx_clients_business ON public.clients(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_created_by ON public.appointments(business_id, created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_start_date ON public.appointments(start_date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_history_client ON public.client_history(client_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_appointment ON public.exceptions(appointment_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad: los usuarios solo pueden ver datos de su negocio
CREATE POLICY "Users can view their business data" ON public.businesses
    FOR ALL USING (id IN (
        SELECT business_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view their profile" ON public.user_profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "Users can view their business services" ON public.services
    FOR ALL USING (business_id IN (
        SELECT business_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Staff can only modify their own services" ON public.services
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their business clients" ON public.clients
    FOR ALL USING (business_id IN (
        SELECT business_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view their business appointments" ON public.appointments
    FOR ALL USING (business_id IN (
        SELECT business_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Staff can only modify their own appointments" ON public.appointments
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their business exceptions" ON public.exceptions
    FOR ALL USING (business_id IN (
        SELECT business_id FROM public.user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view their business client history" ON public.client_history
    FOR ALL USING (business_id IN (
        SELECT business_id FROM public.user_profiles WHERE id = auth.uid()
    ));

-- Datos iniciales: crear el negocio base
INSERT INTO public.businesses (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Barbería Studio Maker')
ON CONFLICT DO NOTHING;