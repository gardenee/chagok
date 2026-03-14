import { supabase } from '@/lib/supabase';
import type { Asset } from '@/types/database';

export async function fetchAssets(coupleId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}
