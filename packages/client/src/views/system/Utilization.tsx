import { Utilization as UtilizationData } from '@metastable/types';
import React, { useState } from 'react';

import { TRPC } from '$api';
import { ProgressBar } from '$components/progressBar';
import { filesize } from '$utils/file';
import styles from './Utilization.module.scss';

const EMPTY_UTILIZATION: UtilizationData = {
  cpuUsage: 0,
  hddTotal: 1,
  hddUsed: 0,
  ramTotal: 1,
  ramUsed: 0,
};

export const Utilization: React.FC = () => {
  const [utilization, setUtilization] = useState<UtilizationData>({
    ...EMPTY_UTILIZATION,
  });

  TRPC.instance.onUtilization.useSubscription(undefined, {
    onData: utilization => {
      setUtilization({ ...EMPTY_UTILIZATION, ...utilization });
    },
  });

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
                {filesize(utilization.vramUsed)}/
                {filesize(utilization.vramTotal)}
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
};
