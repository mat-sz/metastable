import 'dotenv-flow';

export const useProxy = true; // process.env.WS_USE_PROXY === '1';
export const host = process.env.WS_HOST || '0.0.0.0';
export const port = parseInt(process.env.WS_PORT || '5001');
export const staticRoot = process.env.WS_STATIC_ROOT || '../web/build';
