import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLatestBySource } from '../../../../lib/competitors/store';

export async function GET(request: Request) {
  try {
    // 🔐 EXTRAER TOKEN DE AUTENTICACIÓN
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // 🔐 CREAR CLIENTE SUPABASE CON TOKEN DE USUARIO
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // 🔐 VERIFICAR QUE EL USUARIO ESTÉ AUTENTICADO
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const [cerini, mala] = await Promise.all([
      getLatestBySource(supabase, 'cerini'),
      getLatestBySource(supabase, 'mala'),
    ]);
    return NextResponse.json({ cerini, mala });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}


