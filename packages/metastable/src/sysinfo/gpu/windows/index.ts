import powershell from './powershell.js';

const providers = [powershell];

export async function getProviders() {
  return providers;
}
