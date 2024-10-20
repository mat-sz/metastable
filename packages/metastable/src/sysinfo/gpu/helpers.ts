export function normalizeBusAddress(address?: string) {
  if (!address) {
    return undefined;
  }

  const split = address.toLowerCase().split(':');

  if (split.length === 3) {
    split[0] = split[0].padStart(8, '0');
  } else if (split.length === 2) {
    split.unshift('00000000');
  }

  return split.join(':');
}
