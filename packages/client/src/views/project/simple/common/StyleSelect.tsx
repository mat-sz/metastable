import { ProjectSimpleSettings } from '@metastable/types';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

import { PROMPT_STYLES } from '$/data/styles';
import { VarSelect } from '$components/var';
import { useSimpleProject } from '../../context';

type SettingsStyle = ProjectSimpleSettings['prompt']['style'];

interface Props {
  className?: string;
}

export const StyleSelect: React.FC<Props> = observer(({ className }) => {
  const project = useSimpleProject();

  const styles: SettingsStyle[] = [
    undefined,
    ...PROMPT_STYLES.map(style => ({
      ...style,
      source: 'system' as any,
    })),
  ];

  const currentStyle = project.settings.prompt.style;
  const currentIndex = !currentStyle
    ? 0
    : styles.findIndex(
        style => typeof style !== 'undefined' && style.id === currentStyle.id,
      );

  return (
    <VarSelect
      className={className}
      options={[
        ...styles.map((style, i) => ({
          key: i,
          label: typeof style === 'undefined' ? 'No style' : style.name,
        })),
      ]}
      value={currentIndex === -1 ? 0 : currentIndex}
      onChange={value => {
        runInAction(() => {
          project.settings.prompt.style = styles[value];
        });
      }}
    />
  );
});
