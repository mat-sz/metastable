import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsHddFill, BsWrench } from 'react-icons/bs';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { Tab, TabContent, TabPanel, TabView, Tabs } from '../../../components';
import { Card, CardTag, CardTags, List } from '../../../components/list';
import { getStaticUrl } from '../../../config';
import { fuzzy } from '../../../utils/fuzzy';
import { removeFileExtension } from '../../../utils/string';
import { filesize } from '../../../helpers';

export const InstalledModels: React.FC = observer(() => {
  const available = Object.entries(mainStore.info.models).filter(
    entry => entry[1].length > 0,
  );

  const firstKey = Object.keys(mainStore.info.models)[0] || 'checkpoints';

  return (
    <TabView defaultTab={firstKey} direction="vertical" className={styles.view}>
      <Tabs>
        {available.map(([key]) => (
          <Tab id={key} key={key} title={key} />
        ))}
      </Tabs>
      <TabContent>
        {available.map(([key, models]) => (
          <TabPanel id={key} key={key}>
            <List
              items={models}
              quickFilter={(items, search) =>
                fuzzy(
                  items,
                  search,
                  item => `${item.name} ${removeFileExtension(item.file.name)}`,
                )
              }
            >
              {item => (
                <Card
                  name={item.name || removeFileExtension(item.file.name)}
                  key={item.file.name}
                  imageUrl={
                    item.image
                      ? getStaticUrl(`/models/${key}/${item.image}`)
                      : undefined
                  }
                  onClick={() => {
                    // TODO: Display some information
                  }}
                >
                  <CardTags>
                    <CardTag
                      icon={<BsHddFill />}
                      text={filesize(item.file.size)}
                    />
                    {item.baseModel && (
                      <CardTag icon={<BsWrench />} text={item.baseModel} />
                    )}
                  </CardTags>
                </Card>
              )}
            </List>
          </TabPanel>
        ))}
      </TabContent>
    </TabView>
  );
});
