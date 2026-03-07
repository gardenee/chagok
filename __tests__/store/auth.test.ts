import { useAuthStore } from '../../store/auth';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../../types/database';

const mockSession = { user: { id: 'user-1' } } as Session;
const mockProfile: UserProfile = {
  id: 'user-1',
  couple_id: null,
  nickname: '가든',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, userProfile: null });
  });

  it('초기 상태에서 session은 null이다', () => {
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('초기 상태에서 userProfile은 null이다', () => {
    expect(useAuthStore.getState().userProfile).toBeNull();
  });

  it('setSession으로 세션을 설정할 수 있다', () => {
    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().session).toEqual(mockSession);
  });

  it('setUserProfile로 프로필을 설정할 수 있다', () => {
    useAuthStore.getState().setUserProfile(mockProfile);
    expect(useAuthStore.getState().userProfile).toEqual(mockProfile);
  });

  it('setSession(null)로 로그아웃할 수 있다', () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
