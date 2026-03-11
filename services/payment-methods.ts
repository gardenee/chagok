import { supabase } from '@/lib/supabase';
import type { PaymentMethod } from '@/types/database';

export type PaymentMethodInput = {
  name: string;
  type: PaymentMethod['type'];
  icon?: string;
  color?: string;
  limit?: number | null;
  card_company?: string | null;
  billing_day?: number | null;
  annual_fee?: number | null;
  linked_asset_id?: string | null;
  sort_order?: number;
};

export async function fetchPaymentMethods(
  coupleId: string,
): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createPaymentMethod(
  coupleId: string,
  input: PaymentMethodInput,
): Promise<PaymentMethod> {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({ ...input, couple_id: coupleId })
    .select()
    .single();
  if (error) throw error;
  return data as PaymentMethod;
}

export async function updatePaymentMethod(
  id: string,
  input: Partial<PaymentMethodInput>,
): Promise<PaymentMethod> {
  const { data, error } = await supabase
    .from('payment_methods')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PaymentMethod;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
