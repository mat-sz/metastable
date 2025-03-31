import { fuzzy, strIncludes } from '$utils/fuzzy';
import { useConfigStore } from '.';

export function useSearchFn() {
  const config = useConfigStore(state => state.data);

  return config?.ui?.fuzzySearch ? fuzzy : strIncludes;
}
