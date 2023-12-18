import dotenvFlow from 'dotenv-flow';
dotenvFlow.config();

import path from 'path';

export const useProxy = process.env.WS_USE_PROXY === '1';
export const host = process.env.WS_HOST || '0.0.0.0';
export const port = parseInt(process.env.WS_PORT || '5001');
export const staticRoot = path.resolve(
  process.env.WS_STATIC_ROOT || '../client/build',
);

export const dataRoot = path.resolve(process.env.WS_DATA_ROOT || '../../data');
