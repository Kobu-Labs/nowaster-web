type PrefixBasedMatchOpts = Partial<{
  caseInsensitive: boolean
}>

export const prefixBasedMatch = (
  value: string | undefined,
  searchTerm: string | undefined,
  opts?: PrefixBasedMatchOpts,
): boolean => {
  if (value === undefined || searchTerm === undefined) {
    return false;
  }

  if (opts?.caseInsensitive) {
    value = value.toLowerCase();
    searchTerm = searchTerm.toLowerCase();
  }

  if (searchTerm.length > value.length) {
    return false;
  }

  for (let i = 0; i < searchTerm.length; i++) {
    if (searchTerm[i] !== value[i]) {
      return false;
    }
  }

  return true;
};
