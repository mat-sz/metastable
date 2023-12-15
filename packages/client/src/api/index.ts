import { IS_ELECTRON } from '../config';
import { ElectronAPI } from './electron';
import { WebAPI } from './web';

export const API = IS_ELECTRON ? ElectronAPI : WebAPI;
