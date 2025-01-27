import { Utilization as UtilizationData } from '@metastable/types';
import React, { useState } from 'react';
import { BsCpu, BsGpuCard, BsMemory } from 'react-icons/bs';

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

const UtilizationItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  secondaryLabelType?: 'size' | 'temperature';
  secondaryValue?: number;
  value: number;
  max: number;
}> = ({ icon, label, secondaryLabelType, secondaryValue, value, max }) => {
  const percentage = Math.round((value / max) * 100);
  return (
    <div className={styles.item}>
      <div className={styles.title}>
        <span className={styles.label}>
          {icon}
          <span>{label}</span>
        </span>
        <span className={styles.secondaryLabel}>
          {secondaryLabelType === 'size' &&
            `${filesize(value)}/${filesize(max)}`}
          {secondaryLabelType === 'temperature' &&
            typeof secondaryValue === 'number' &&
            `${secondaryValue}°C`}
        </span>
      </div>
      <div className={styles.bar}>
        <ProgressBar value={value} max={max} />
        <span>{percentage}%</span>
      </div>
    </div>
  );
};

export const Utilization: React.FC = () => {
  const [utilization, setUtilization] = useState<UtilizationData>();

  TRPC.instance.onUtilization.useSubscription(undefined, {
    onData: utilization => {
      setUtilization({ ...EMPTY_UTILIZATION, ...utilization });
    },
  });

  if (!utilization) {
    return (
      <div className={styles.utilization}>
        <div className={styles.loading}>Loading utilization...</div>
      </div>
    );
  }

  return (
    <div className={styles.utilization}>
      <UtilizationItem
        icon={<BsCpu />}
        label="CPU"
        secondaryLabelType="temperature"
        secondaryValue={utilization.cpuTemperature}
        value={utilization.cpuUsage}
        max={100}
      />
      {typeof utilization.gpuUsage === 'number' && (
        <UtilizationItem
          icon={<BsGpuCard />}
          label="GPU"
          secondaryLabelType="temperature"
          secondaryValue={utilization.gpuTemperature}
          value={utilization.gpuUsage}
          max={100}
        />
      )}
      <UtilizationItem
        icon={<BsMemory />}
        label="RAM"
        secondaryLabelType="size"
        value={utilization.ramUsed}
        max={utilization.ramTotal}
      />
      {typeof utilization.vramTotal === 'number' &&
        typeof utilization.vramUsed === 'number' && (
          <UtilizationItem
            icon={<BsMemory />}
            label="VRAM"
            secondaryLabelType="size"
            value={utilization.vramUsed}
            max={utilization.hddTotal}
          />
        )}
    </div>
  );
};
