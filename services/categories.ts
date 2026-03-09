import { supabase } from '../lib/supabase';
import type { Category } from '../types/database';

export type CategoryInput = {
  name: string;
  icon: string;
  color: string;
  budget_amount: number;
  sort_order?: number;
  type?: 'expense' | 'income';
};

export async function fetchCategories(coupleId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCategory(
  coupleId: string,
  input: CategoryInput,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, couple_id: coupleId })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
