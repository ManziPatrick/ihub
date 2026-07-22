import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ME } from "@/lib/graphql/queries";
import { UPDATE_USER } from "@/lib/graphql/mutations";

export const YEAR_OPTIONS: Record<string, string[]> = {
    nursery: ["N1", "N2", "N3"],
    primary: ["P1", "P2", "P3", "P4", "P5", "P6"],
    secondary: ["S1", "S2", "S3", "S4", "S5", "S6"],
    university: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+", "Masters", "PHD", "Other"],
    cambridge: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "O Level", "AS Level", "A Level", "Foundation", "Other"],
    high_school: ["S1", "S2", "S3", "S4", "S5", "S6", "Other"],
    undergraduate: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5+", "Other"],
    graduate: ["Masters", "PHD", "Other"],
    postgraduate: ["Post-Doc", "Research", "Other"],
    other: ["N/A", "Other"]
};

/**
 * Invisible onboarding guard — silently dismisses the onboarding flag
 * for returning users who have already completed the tour.
 *
 * For first-time users, does NOT dismiss — lets the PlatformTour
 * auto-trigger so the user can complete the tour first.
 * The PlatformTour sets isFirst: false after completion/skip.
 *
 * Never blocks the user — renders children immediately.
 */
export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
    const { user, updateUser } = useAuth();
    const dismissedRef = useRef(false);

    const { data, loading } = useQuery(GET_ME, {
        skip: !user || user.role !== 'student' || user.isFirst === false,
        fetchPolicy: 'network-only',
    }) as any;

    const [dismissOnboarding] = useMutation(UPDATE_USER);

    useEffect(() => {
        // If already marked as done in AuthContext, skip
        if (user?.role === 'student' && user?.isFirst === false) {
            return;
        }

        // If query hasn't loaded yet or no data, skip
        if (loading || !data?.me || dismissedRef.current) return;
        dismissedRef.current = true;

        const me = data.me;
        const isFirst = me.isFirst;
        const tourCompleted = localStorage.getItem(`tour_completed_${me.id}`);

        // Only dismiss isFirst if the user has already completed the tour.
        // Otherwise the tour will auto-trigger and handle isFirst after completion.
        if (isFirst === true && tourCompleted) {
            console.debug("[ProfileGuard] Dismissing onboarding for returning user", me.email);
            dismissOnboarding({
                variables: { id: me.id, isFirst: false },
            }).then(() => {
                updateUser({ isFirst: false });
            }).catch((err: any) => {
                console.debug("[ProfileGuard] Dismiss failed:", err);
            });
        }
    }, [data, loading, user, dismissOnboarding, updateUser]);

    // Always render children — never block
    return <>{children}</>;
}
