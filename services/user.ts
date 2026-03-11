import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/database';

export async function createUserProfile(
  userId: string,
  nickname: string,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, nickname })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateNickname(
  userId: string,
  nickname: string,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
