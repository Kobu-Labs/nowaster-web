'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/auth-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent processing tokens multiple times
    if (processedRef.current) return;

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      processedRef.current = true;

      setTokens(accessToken, refreshToken);

      router.push('/home');
    } else {
      router.push('/sign-in');
    }
  }, [searchParams, router, setTokens]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
