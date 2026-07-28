import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client/react';
import { gql } from "@apollo/client";
import { toast } from 'sonner';
import { env } from '@/lib/env';

const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($token: String!) {
    googleLogin(token: $token) {
      token
      user {
        id
        username
        email
        role
      }
    }
  }
`;

interface GoogleLoginData {
    googleLogin: {
        token: string;
        user: {
            id: string;
            username: string;
            email: string;
            role: string;
        };
    };
}

export function GoogleOneTap() {
    const { user, loginWithToken, isLoading } = useAuth();
    const [googleLogin] = useMutation<GoogleLoginData>(GOOGLE_LOGIN);
    const isPromptActiveRef = useRef(false);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // Don't show if already logged in OR on the auth page (avoid redundancy)
        // Also wait for auth to finish loading to be sure of the state
        if (isLoading || user || window.location.pathname === '/auth') return;

        const handleCredentialResponse = async (response: any) => {
            try {
                // Sync with Backend using Google Credential
                const { data } = await googleLogin({
                    variables: { token: response.credential }
                });

                if (data?.googleLogin) {
                    loginWithToken(data.googleLogin.token, data.googleLogin.user);
                    toast.success('Successfully logged in with Google');
                }
            } catch (error: any) {
                console.error('Google login error:', error);
                toast.error('Google login failed');
            }
        };

        // Initialize Google One Tap
        const initializeGoogleOneTap = () => {
            if (!(window as any).google) {
                console.error('Google script not loaded');
                return;
            }

            if (!isInitializedRef.current) {
                (window as any).google.accounts.id.initialize({
                    client_id: env.GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    cancel_on_tap_outside: false,
                    auto_select: true,
                    use_fedcm_for_prompt: true,
                    itp_support: true,
                });
                isInitializedRef.current = true;
            }

            if (isPromptActiveRef.current) return;
            isPromptActiveRef.current = true;

            console.log('Google One Tap initialized for origin:', window.location.origin);

            (window as any).google.accounts.id.prompt((notification: any) => {
                isPromptActiveRef.current = false;

                if (notification.isNotDisplayed?.()) {
                    console.warn('One Tap prompt not displayed:', notification.getNotDisplayedReason?.());
                }
            });
        };

        // Load Google script if not present
        if (!(window as any).google) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogleOneTap;
            document.head.appendChild(script);
        } else {
            initializeGoogleOneTap();
        }

            // Cleanup: cancel prompt and cancel any pending auto-select
        return () => {
            isPromptActiveRef.current = false;
            if ((window as any).google?.accounts?.id) {
                (window as any).google.accounts.id.cancel();
                try {
                    (window as any).google.accounts.id.disableAutoSelect();
                } catch {
                    // disableAutoSelect may not be available in all versions
                }
            }
        };
    }, [user, googleLogin, loginWithToken]);

    return null;
}
