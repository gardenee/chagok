import { useAuthStore } from '../../store/auth';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('초기 상태에서 user는 null이다', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });

  it('setUser로 사용자를 설정할 수 있다', () => {
    const mockUser = { id: '1', nickname: '가든', coupleId: null };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setUser(null)로 로그아웃할 수 있다', () => {
    useAuthStore.getState().setUser({ id: '1', nickname: '가든', coupleId: null });
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
