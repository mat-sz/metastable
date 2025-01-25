import React, { useState } from 'react';
import { useTranslation } from 'react-i18not';
import {
  BsArrowUpRightSquare,
  BsExclamationTriangle,
  BsStarFill,
} from 'react-icons/bs';

import { Alert, Alerts } from '$components/alert';
import { downloadable } from '$data/models';
import { DownloadableModel, DownloadableModelGroup } from '$types/model';
import styles from './index.module.scss';
import { IconButton } from '../iconButton';

interface Props {
  beforeModel?: (model: DownloadableModel) => React.ReactNode;
  afterModel?: (model: DownloadableModel) => React.ReactNode;
  isSetup?: boolean;
}

export const ModelList: React.FC<Props> = ({
  beforeModel,
  afterModel,
  isSetup,
}) => {
  const { t } = useTranslation('model');
  const [openGroup, setOpenGroup] = useState(0);

  let items = [...downloadable];
  if (isSetup) {
    items = items
      .map(group => {
        if (!group.recommended) {
          return undefined;
        }

        const models = group.models.filter(
          model => model.recommended && !model.warnings?.length,
        );
        if (!models.length) {
          return undefined;
        }

        return {
          ...group,
          models,
        };
      })
      .filter(group => !!group) as DownloadableModelGroup[];
  }

  return (
    <div className={styles.list}>
      {items.map((group, i) => (
        <div key={i} className={styles.group}>
          <div className={styles.header} onClick={() => setOpenGroup(i)}>
            <div className={styles.info}>
              {!isSetup && group.recommended && <BsStarFill />}
              <div className={styles.title}>{group.name}</div>
              <div className={styles.type}>{t(`model:type.${group.type}`)}</div>
            </div>
            {group.description && (
              <div className={styles.description}>{group.description}</div>
            )}
          </div>
          {openGroup === i && (
            <div className={styles.models}>
              {group.models.map((model, i) => (
                <div key={i} className={styles.model}>
                  {beforeModel?.(model)}
                  <div className={styles.modelInfo}>
                    <div className={styles.modelName}>
                      {!isSetup && model.recommended && <BsStarFill />}
                      <span>{model.name}</span>
                      <div className={styles.type}>
                        {t(`model:type.${group.type}`)}
                      </div>
                      {!!model.homepage && (
                        <IconButton href={model.homepage}>
                          <BsArrowUpRightSquare />
                        </IconButton>
                      )}
                    </div>
                    {model.description && (
                      <div className={styles.description}>
                        {model.description}
                      </div>
                    )}
                  </div>
                  {afterModel?.(model)}
                  {!!model.warnings?.length && (
                    <div className={styles.warnings}>
                      <BsExclamationTriangle />
                      <Alerts className={styles.warningsList}>
                        {model.warnings?.map(warning => (
                          <Alert variant="warning" key={warning}>
                            {t(`model:warning.${warning}`)}
                          </Alert>
                        ))}
                      </Alerts>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
