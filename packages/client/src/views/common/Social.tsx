import React from 'react';
import { BsDiscord, BsGithub, BsTwitter } from 'react-icons/bs';

import { Button } from '$components/button';
import styles from './Social.module.scss';

export const Social: React.FC = () => {
  return (
    <div className={styles.social}>
      <Button href="https://discord.gg/Sf9zKaXzXe" icon={<BsDiscord />}>
        Join Metastable Discord for updates
      </Button>
      <Button href="https://github.com/mat-sz/metastable" icon={<BsGithub />}>
        Source code
      </Button>
      <Button href="https://twitter.com/get_metastable" icon={<BsTwitter />}>
        Twitter
      </Button>
    </div>
  );
};
