import React from 'react';
import { observer } from 'mobx-react-lite';

import styles from './Utilization.module.scss';
import { mainStore } from '../../stores/MainStore';
import { ProgressBar } from '../../components/progressBar';
import { filesize } from '../../helpers';

const MB = 1024 * 1024;

export const Utilization: React.FC = observer(() => {
  const utilization = mainStore.utilization;

  return (
    <div className={styles.utilization}>
      <div>
        <span>CPU</span>
        <ProgressBar value={utilization.cpuUsage} max={100}>
          <span>{Math.round(utilization.cpuUsage)}%</span>
          {typeof utilization.cpuTemperature === 'number' && (
            <span>{utilization.cpuTemperature}°C</span>
          )}
        </ProgressBar>
      </div>
      {typeof utilization.gpuUsage === 'number' && (
        <div>
          <span>GPU</span>
          <ProgressBar value={utilization.gpuUsage} max={100}>
            <span>{Math.round(utilization.gpuUsage)}%</span>
            {typeof utilization.gpuTemperature === 'number' && (
              <span>{utilization.gpuTemperature}°C</span>
            )}
          </ProgressBar>
        </div>
      )}
      <div>
        <span>RAM</span>
        <ProgressBar value={utilization.ramUsed} max={utilization.ramTotal}>
          <span>
            {Math.round((utilization.ramUsed / utilization.ramTotal) * 100)}%
          </span>
          <span>
            {filesize(utilization.ramUsed)}/{filesize(utilization.ramTotal)}
          </span>
        </ProgressBar>
      </div>
      {typeof utilization.vramTotal === 'number' &&
        typeof utilization.vramUsed === 'number' && (
          <div>
            <span>VRAM</span>
            <ProgressBar
              value={utilization.vramUsed}
              max={utilization.vramTotal}
            >
              <span>
                {Math.round(
                  (utilization.vramUsed / utilization.vramTotal) * 100,
                )}
                %
              </span>
              <span>
                {filesize(utilization.vramUsed * MB)}/
                {filesize(utilization.vramTotal * MB)}
              </span>
            </ProgressBar>
          </div>
        )}
      <div>
        <span>HDD</span>
        <ProgressBar value={utilization.hddUsed} max={utilization.hddTotal}>
          <span>
            {Math.round((utilization.hddUsed / utilization.hddTotal) * 100)}%
          </span>
          <span>
            {filesize(utilization.hddUsed)}/{filesize(utilization.hddTotal)}
          </span>
        </ProgressBar>
      </div>
    </div>
  );
});
