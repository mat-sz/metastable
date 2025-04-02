import { useUIStore } from '$store/ui';
import { fuzzy, strIncludes } from '$utils/fuzzy';
import { useConfigStore } from '.';

export function useSearchFn() {
  const fuzzySearch = useConfigStore(state => !!state.data?.ui?.fuzzySearch);
  return fuzzySearch ? fuzzy : strIncludes;
}

export function useTheme() {
  const configTheme = useConfigStore(state => state.data?.ui.theme || 'dark');
  const systemTheme = useUIStore(state => state.systemTheme);
  return configTheme === 'system' ? systemTheme : configTheme;
}

export function useFontSize() {
  return useConfigStore(state => state.data?.ui.fontSize || 16);
}
