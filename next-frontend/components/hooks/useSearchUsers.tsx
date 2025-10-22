import { searchUsers } from "@/api/impersonationApi";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useSearchUsers = (initialQuery = "", debounceMs = 300) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  const query = useQuery({
    enabled: debouncedQuery.trim().length > 0,
    queryFn: () => searchUsers(debouncedQuery),
    queryKey: ["admin-search-users", debouncedQuery],
  });

  return {
    isError: query.isError,
    // if query strings are the same, a debounce timer is running
    isLoading: query.isLoading || searchQuery !== debouncedQuery,
    searchQuery,
    setSearchQuery,
    users: query.data ?? [],
  };
};
