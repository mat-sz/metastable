import dotenvFlow from 'dotenv-flow';
dotenvFlow.config();

import path from 'path';

export const useProxy = process.env.SERVER_USE_PROXY === '1';
export const skipPythonSetup = process.env.SERVER_SKIP_PYTHON_SETUP === '1';
export const host = process.env.SERVER_HOST || '0.0.0.0';
export const port = parseInt(process.env.SERVER_PORT || '5001');
export const staticRoot = path.resolve(
  process.env.SERVER_STATIC_ROOT || '../client/dist',
);

export const dataRoot = path.resolve(
  process.env.SERVER_DATA_ROOT || '../../data',
);
