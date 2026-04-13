import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';

type OAuthProvider = 'kakao' | 'google';

export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const redirectUrl = Linking.createURL('auth/callback');

  // 웹에서는 전체 페이지 리다이렉트 방식 사용
  // (detectSessionInUrl: true 로 Supabase가 콜백 URL에서 자동으로 토큰 처리)
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) throw error ?? new Error('OAuth URL 생성 실패');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  console.log('[Auth] openAuthSessionAsync result.type:', result.type);

  if (result.type !== 'success') return;

  console.log('[Auth] result.url:', result.url);

  // PKCE flow — query param에서 code 추출 후 세션 교환
  const url = new URL(result.url);
  const code = url.searchParams.get('code');

  console.log('[Auth] code found:', !!code);

  if (!code) throw new Error('인증 코드를 받지 못했습니다');

  const { error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);
  console.log(
    '[Auth] exchangeCodeForSession error:',
    sessionError?.message ?? 'none',
  );
  if (sessionError) throw sessionError;
}

export async function signInWithApple(): Promise<{
  displayName: string | null;
}> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('Apple 인증 토큰이 없습니다');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;

  // Apple은 최초 로그인 시에만 fullName을 제공
  const givenName = credential.fullName?.givenName ?? null;
  const familyName = credential.fullName?.familyName ?? null;
  const displayName = givenName
    ? [givenName, familyName].filter(Boolean).join(' ')
    : null;

  return { displayName };
}
