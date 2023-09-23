export const prefixBasedMatch = (value: string, searchTerm: string): boolean => {

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
