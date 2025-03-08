import React from 'react';

import { stringToColor } from '$utils/string';

interface Props {
  className?: string;
  tag?: string;
}

export const TagIcon: React.FC<Props> = ({ tag, ...props }) => {
  return (
    <svg viewBox="0 0 100 100" height="1em" width="1em" {...props}>
      <circle cx="50" cy="50" r="40" fill={stringToColor(tag)} />
    </svg>
  );
};
