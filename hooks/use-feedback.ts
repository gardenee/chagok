import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { FeedbackType } from '@/types/database';

async function submitFeedback(
  userId: string,
  type: FeedbackType,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, type, content });
  if (error) throw error;
}

export function useSubmitFeedback() {
  const { session } = useAuthStore();
  const userId = session?.user.id ?? '';

  return useMutation({
    mutationFn: ({
      type,
      content,
    }: {
      type: FeedbackType;
      content: string;
    }) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      return submitFeedback(userId, type, content);
    },
  });
}
