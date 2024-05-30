import React from 'react';
import { BsDiscord, BsGithub, BsTwitter } from 'react-icons/bs';

import { Button } from '$components/button';
import styles from './Social.module.scss';

export const Social: React.FC = () => {
  return (
    <div className={styles.social}>
      <Button href="https://discord.gg/Sf9zKaXzXe">
        <BsDiscord />
        <span>Join Metastable Discord for updates</span>
      </Button>
      <Button href="https://github.com/mat-sz/metastable">
        <BsGithub />
        <span>Source code</span>
      </Button>
      <Button href="https://twitter.com/get_metastable">
        <BsTwitter />
        <span>Twitter</span>
      </Button>
    </div>
  );
};
