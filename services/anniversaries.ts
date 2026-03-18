import { supabase } from '@/lib/supabase';
import type { Anniversary } from '@/types/database';

export type AnniversaryInput = {
  name: string;
  date: string; // MM-DD
  type: 'birthday_me' | 'birthday_partner' | 'anniversary';
};

export async function fetchAnniversaries(
  coupleId: string,
): Promise<Anniversary[]> {
  const { data, error } = await supabase
    .from('anniversaries')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAnniversary(
  coupleId: string,
  input: AnniversaryInput,
): Promise<Anniversary> {
  const { data, error } = await supabase
    .from('anniversaries')
    .insert({ couple_id: coupleId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnniversary(
  id: string,
  input: Partial<AnniversaryInput>,
): Promise<void> {
  const { error } = await supabase
    .from('anniversaries')
    .update(input)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAnniversary(id: string): Promise<void> {
  const { error } = await supabase.from('anniversaries').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertBirthday(
  coupleId: string,
  type: 'birthday_me' | 'birthday_partner',
  name: string,
  date: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('anniversaries')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    await updateAnniversary(existing.id, { name, date });
  } else {
    await createAnniversary(coupleId, { name, date, type });
  }
}
