import { useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PRESENCE, GO_OFFLINE } from '@/lib/graphql/mutations';
import { useAuth } from '@/contexts/AuthContext';

export function usePresence() {
    const { user } = useAuth();
    const [updatePresence] = useMutation(UPDATE_PRESENCE);
    const [goOffline] = useMutation(GO_OFFLINE);

    useEffect(() => {
        if (!user) return;

        // Initial check-in
        updatePresence().catch(console.error);

        // Heartbeat every 45 seconds
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                updatePresence().catch(console.error);
            }
        }, 45000);

        // Handle tab focus/visibility
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updatePresence().catch(console.error);
            }
        };

        // Handle session end
        const handleBeforeUnload = () => {
            // Use navigator.sendBeacon or a synchronous call if possible, 
            // but GraphQL mutations are async. Best effort here.
            goOffline().catch(console.error);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Best effort offline signal
            goOffline().catch(console.error);
        };
    }, [user, updatePresence, goOffline]);
}
