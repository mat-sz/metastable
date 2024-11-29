import clinfo from './clinfo.js';
import lspci from './lspci.js';

const providers = [lspci, clinfo];

export async function getProviders() {
  return providers;
}
