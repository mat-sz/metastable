import path from 'path';

export const PATH_WINDOWS = process.env.WINDIR || 'C:\\Windows';
export const PATH_PROGRAM_FILES =
  process.env['ProgramW6432'] ||
  process.env['ProgramFiles'] ||
  'C:\\Program Files';
export const PATH_SYSTEM32 = path.join(PATH_WINDOWS, 'System32');
