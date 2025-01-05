import { allResolved, memoized } from '#helpers/common.js';
import * as amd from './amd/index.js';
import * as linux from './linux/index.js';
import * as mac from './mac/index.js';
import * as nvidia from './nvidia/index.js';
import * as windows from './windows/index.js';

async function _getProviders() {
  const providers = (
    await allResolved([
      mac.getProviders(),
      linux.getProviders(),
      windows.getProviders(),
      amd.getProviders(),
      nvidia.getProviders(),
    ])
  )
    .filter(out => !!out)
    .flat();

  return (
    await allResolved(
      providers.map(async provider =>
        (await provider.isAvailable()) ? provider : undefined,
      ),
    )
  ).filter(out => !!out);
}

export const getProviders = memoized(_getProviders);
