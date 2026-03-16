import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/database';

export type CommentRow = Comment & {
  users: { nickname: string } | null;
};

export async function fetchTransactionComments(
  transactionId: string,
): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, users(nickname)')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommentRow[];
}

export async function createComment(
  userId: string,
  transactionId: string,
  content: string,
): Promise<CommentRow> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ transaction_id: transactionId, user_id: userId, content })
    .select('*, users(nickname)')
    .single();
  if (error) throw error;
  return data as unknown as CommentRow;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}
