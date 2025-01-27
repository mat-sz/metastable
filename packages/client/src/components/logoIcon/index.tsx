import React from 'react';

interface Props {
  className?: string;
}

export const LogoIcon: React.FC<Props> = props => {
  return (
    <svg viewBox="0 0 77.7 77.7" height="1em" width="1em" {...props}>
      <g transform="translate(-11.2 -8.67)">
        <path
          d="m84.3 69.8-34.3 19.8-34.3-19.8 5.84-34.6 28.5-24.8 28.5 24.8z"
          display="none"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit={0}
          strokeWidth={0.792}
        />
        <g transform="translate(-9.59e-5)" fill="currentColor">
          <circle cx={34.3} cy={18.7} r={3} />
          <circle cx={65.7} cy={18.7} r={3} />
          <circle cx={50} cy={12.7} r={6} />
          <circle cx={50} cy={34.3} r={9} />
          <g transform="rotate(120 49.9 50.7)">
            <circle cx={34.3} cy={18.7} r={3} />
            <circle cx={65.7} cy={18.7} r={3} />
            <circle cx={50} cy={12.7} r={6} />
            <circle cx={50} cy={34.3} r={9} />
          </g>
          <g transform="matrix(.5 .866 .866 -.5 -18.8 32.9)">
            <circle cx={34.3} cy={18.7} r={3} />
            <circle cx={65.7} cy={18.7} r={3} />
            <circle cx={50} cy={12.7} r={6} />
            <circle cx={50} cy={34.3} r={9} />
          </g>
        </g>
      </g>
    </svg>
  );
};
