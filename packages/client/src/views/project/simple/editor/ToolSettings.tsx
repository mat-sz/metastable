import React, { useEffect, useState } from 'react';
import { VarSlider, VarUI } from 'react-var-ui';

import { useEditor } from './context';
import styles from './index.module.scss';

export const ToolSettings: React.FC = () => {
  const editor = useEditor();
  const [options, setOptions] = useState(editor.currentTool.options);
  const [settings, setSettings] = useState(editor.currentTool.settings);

  useEffect(() => {
    const onToolChanged = () => {
      setOptions(editor.currentTool.options);
      setSettings(editor.currentTool.settings);
    };

    const onSettingsChanged = () => {
      setSettings(editor.currentTool.settings);
    };

    editor.on('toolChanged', onToolChanged);
    editor.on('toolSettingsChanged', onSettingsChanged);

    return () => {
      editor.off('toolChanged', onToolChanged);
      editor.on('toolSettingsChanged', onSettingsChanged);
    };
  }, [editor, setOptions, setSettings]);

  return (
    <div className={styles.toolSettings}>
      <VarUI
        values={settings}
        onChange={values => editor.updateToolSettings(values)}
        className={styles.settings}
      >
        {options.map(option => (
          <VarSlider
            key={option.id}
            label={option.name}
            path={option.id}
            min={option.min}
            max={option.max}
            step={option.step}
            defaultValue={option.defaultValue}
            unit={option.unit}
          />
        ))}
      </VarUI>
    </div>
  );
};
