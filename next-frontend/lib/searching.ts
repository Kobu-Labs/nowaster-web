type PrefixBasedMatchOpts = Partial<{
  caseInsensitive: boolean
}>

export const prefixBasedMatch = (value: string, searchTerm: string, opts?: PrefixBasedMatchOpts): boolean => {
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
