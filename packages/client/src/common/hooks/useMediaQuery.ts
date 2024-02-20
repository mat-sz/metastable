import { useLayoutEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);

    const onChange = () => {
      setMatches(matchMedia.matches);
    };

    onChange();

    if (matchMedia.addListener) {
      matchMedia.addListener(onChange);
    } else {
      matchMedia.addEventListener('change', onChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(onChange);
      } else {
        matchMedia.removeEventListener('change', onChange);
      }
    };
  }, [query, setMatches]);

  return matches;
}
