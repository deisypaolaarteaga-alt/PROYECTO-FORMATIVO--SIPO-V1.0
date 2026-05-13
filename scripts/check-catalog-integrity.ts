
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: chapters, error: err } = await supabase.from('catalogo_capitulos').select('tipo_obra');
  if (err) {
    console.error(err);
    return;
  }
  
  const summary = chapters.reduce((acc: any, curr: any) => {
    acc[curr.tipo_obra] = (acc[curr.tipo_obra] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Chapters Summary:', summary);

  const { data: acts, error: err2 } = await supabase.from('catalogo_actividades').select('tipo_obra, precio_referencia_nacional');
  if (err2) {
    console.error(err2);
    return;
  }

  const zeroPrices = acts.filter((a: any) => Number(a.precio_referencia_nacional) === 0);
  console.log('Total activities:', acts.length);
  console.log('Activities with zero price:', zeroPrices.length);
  
  const summaryActs = acts.reduce((acc: any, curr: any) => {
    if (!acc[curr.tipo_obra]) acc[curr.tipo_obra] = { total: 0, zeros: 0 };
    acc[curr.tipo_obra].total++;
    if (Number(curr.precio_referencia_nacional) === 0) acc[curr.tipo_obra].zeros++;
    return acc;
  }, {});

  console.log('Activities Summary by Type:', summaryActs);
}

check();
