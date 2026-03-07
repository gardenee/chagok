import { supabase } from '../lib/supabase';

export async function createCouple(bookName: string, inviteCode: string): Promise<void> {
  const { error } = await supabase.rpc('create_couple', {
    book_name: bookName,
    invite_code: inviteCode,
  });
  if (error) throw error;
}

export async function joinCouple(inviteCode: string): Promise<void> {
  const { error } = await supabase.rpc('join_couple', { invite_code: inviteCode });
  if (error) {
    if (error.code === 'P0001') {
      throw new Error('INVALID_CODE');
    }
    throw error;
  }
}
