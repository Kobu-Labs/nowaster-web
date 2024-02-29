import { QueryFunction, QueryKey, useQuery, UseQueryOptions } from "@tanstack/react-query";

export const useQueryFactory =
  <TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(opts: {
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryKey" | "queryFn">
  }
  ) => {
    return useQuery(opts);
  };

export type QueryOpts = Omit<UseQueryOptions<unknown>, "queryKey" | "queryFn">
