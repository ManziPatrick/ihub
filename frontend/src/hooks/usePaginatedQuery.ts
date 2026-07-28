import { useQuery as useApolloQuery } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import type { TypedDocumentNode, OperationVariables } from "@apollo/client";

/**
 * Options for `usePaginatedQuery`.
 *
 * Extends Apollo's `useQuery.Options` so you can pass any standard
 * `useQuery` option — variables, skip, pollInterval, onCompleted, etc.
 *
 * The only difference: `fetchPolicy` defaults to `"cache-and-network"`
 * with `nextFetchPolicy: "cache-first"` and
 * `notifyOnNetworkStatusChange: true`, so every pagination change
 * triggers a fresh network request while still showing cached data
 * on repeat visits.
 *
 * @example
 * ```tsx
 * const { data, loading } = usePaginatedQuery(GET_USERS, {
 *   variables: { page: currentPage, limit: pageSize },
 * });
 * ```
 */
/** @internal - Extract the options type from Apollo's useQuery namespace */
type UseQueryOptions<TData, TVariables extends OperationVariables> = Omit<
  Parameters<typeof useApolloQuery>[1],
  "fetchPolicy" | "nextFetchPolicy"
> & { variables?: TVariables };

/**
 * Options for `usePaginatedQuery`.
 *
 * Extends Apollo's `useQuery` options so you can pass any standard
 * `useQuery` option — variables, skip, pollInterval, onCompleted, etc.
 *
 * The only difference: `fetchPolicy` defaults to `"cache-and-network"`
 * with `nextFetchPolicy: "cache-first"` and
 * `notifyOnNetworkStatusChange: true`, so every pagination change
 * triggers a fresh network request while still showing cached data
 * on repeat visits.
 *
 * @example
 * ```tsx
 * const { data, loading } = usePaginatedQuery(GET_USERS, {
 *   variables: { page: currentPage, limit: pageSize },
 * });
 * ```
 */
export type UsePaginatedQueryOptions<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
> = UseQueryOptions<TData, TVariables> & {
  /**
   * When `true`, uses `fetchPolicy: "network-only"` instead of the
   * default `"cache-and-network"`. Useful for pages like error reports
   * or completed-users views that must always fetch fresh data.
   *
   * @default false
   */
  networkOnly?: boolean;
};

/**
 * A drop‑in replacement for Apollo's `useQuery` optimised for
 * paginated / server‑side‑filtered lists.
 *
 * Automatically applies:
 * - `fetchPolicy: "cache-and-network"` (or `"network-only"` if
 *   `networkOnly: true` is passed)
 * - `nextFetchPolicy: "cache-first"` (after the first network fetch,
 *   subsequent re‑renders with the same variables hit the cache)
 * - `notifyOnNetworkStatusChange: true` (the `loading` flag accurately
 *   reflects in‑flight network requests)
 *
 * Accepts **every** option that Apollo's `useQuery` accepts, so you
 * can pass `variables`, `skip`, `pollInterval`, `onCompleted`, etc.
 *
 * @example
 * ```tsx
 * const { data, loading, refetch } = usePaginatedQuery(GET_COURSES, {
 *   variables: { page, limit: pageSize },
 *   skip: !user,
 * });
 * ```
 *
 * @example networkOnly
 * ```tsx
 * const { data } = usePaginatedQuery(GET_ERROR_REPORTS, {
 *   variables: { page, limit: 50 },
 *   networkOnly: true,
 * });
 * ```
 */
export function usePaginatedQuery<
  TData = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: UsePaginatedQueryOptions<TData, TVariables>,
) {
  const { networkOnly, ...rest } = options ?? {};

  return useApolloQuery(query, {
    ...(rest as any),
    fetchPolicy: (rest as any).fetchPolicy ?? (networkOnly ? "network-only" : "cache-and-network"),
    nextFetchPolicy: (rest as any).nextFetchPolicy ?? "cache-first",
    notifyOnNetworkStatusChange: true,
  });
}
