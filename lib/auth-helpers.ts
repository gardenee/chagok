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

  if (result.type !== 'success') return;

  // implicit flow — 해시에서 토큰 파싱
  const hashPart = result.url.split('#')[1] ?? '';
  const params = new URLSearchParams(hashPart);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) throw new Error('토큰을 받지 못했습니다');

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}

export async function signInWithApple(): Promise<void> {
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
}
