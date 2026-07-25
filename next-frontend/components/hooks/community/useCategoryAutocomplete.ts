import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useCategoryAutocomplete = (initialPrefix = "", debounceMs = 300) => {
  const [prefix, setPrefix] = useState(initialPrefix);
  const [debouncedPrefix, setDebouncedPrefix] = useState(initialPrefix);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrefix(prefix);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [prefix, debounceMs]);

  const query = useQuery({
    ...queryKeys.communities.categoryAutocomplete(debouncedPrefix),
    enabled: debouncedPrefix.trim().length > 0,
  });

  return {
    isLoading: query.isLoading || prefix !== debouncedPrefix,
    prefix,
    setPrefix,
    suggestions: query.data ?? [],
  };
};
