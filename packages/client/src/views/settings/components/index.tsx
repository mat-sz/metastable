import React from 'react';
import { BsGear } from 'react-icons/bs';

import { Alert, Alerts } from '$components/alert';
import { Button } from '$components/button';
import { Checkbox } from '$components/checkbox';
import { IconButton } from '$components/iconButton';
import { Link } from '$components/link';
import { Loading } from '$components/loading';
import { LogSimple } from '$components/log';
import { ProgressBar } from '$components/progressBar';
import { ProgressButton } from '$components/progressButton';
import { ProgressCircle } from '$components/progressCircle';
import { Rating } from '$components/rating';
import { Search } from '$components/search';
import { Switch, SwitchOption } from '$components/switch';
import { TabPanel } from '$components/tabs';
import { Toggle } from '$components/toggle';

export const SettingsComponents: React.FC = () => {
  return (
    <TabPanel id="components">
      <h2>Component preview</h2>
      <div>
        <h3>Alerts</h3>
        <Alerts>
          <Alert variant="error">Test error alert.</Alert>
          <Alert variant="warning">Test warning alert.</Alert>
          <Alert variant="ok">Test ok alert.</Alert>
        </Alerts>
        <Alert variant="error">Test error alert.</Alert>
        <Alert variant="warning">Test warning alert.</Alert>
        <Alert variant="ok">Test ok alert.</Alert>
      </div>
      <div>
        <h3>Buttons</h3>
        <Button variant="default">Default button</Button>
        <Button variant="primary">Primary button</Button>
        <Button variant="secondary">Secondary button</Button>
        <Button variant="danger">Danger button</Button>
      </div>
      <div>
        <h3>Checkbox</h3>
        <Checkbox label="Test checkbox" />
      </div>
      <div>
        <h3>Icon button</h3>
        <IconButton>
          <BsGear />
        </IconButton>
      </div>
      <div>
        <h3>Link</h3>
        <Link href="https://metastable.studio">Click here</Link>
      </div>
      <div>
        <h3>Loading</h3>
        <Loading />
      </div>
      <div>
        <h3>Log</h3>
        <LogSimple log={'Testing log.\n'.repeat(20)} />
      </div>
      <div>
        <h3>Progress bar</h3>
        <ProgressBar value={10} max={20} />
        <ProgressBar value={0} max={20} />
        <ProgressBar value={20} max={20} />
        <ProgressBar marquee />
      </div>
      <div>
        <h3>Progress button</h3>
        <ProgressButton value={10} max={20}>
          Test button
        </ProgressButton>
        <ProgressButton value={0} max={20}>
          Test button
        </ProgressButton>
        <ProgressButton value={20} max={20}>
          Test button
        </ProgressButton>
        <ProgressButton marquee>Test button</ProgressButton>
      </div>
      <div>
        <h3>Progress circle</h3>
        <ProgressCircle value={10} max={20} />
        <ProgressCircle value={0} max={20} />
        <ProgressCircle value={20} max={20} />
      </div>
      <div>
        <h3>Rating</h3>
        <div>
          <Rating value={4} />
        </div>
        <div>
          <Rating value={4} small />
        </div>
      </div>
      <div>
        <h3>Search</h3>
        <Search value="test" onChange={() => {}} />
      </div>
      <div>
        <h3>Switch</h3>
        <Switch value="test1" onChange={() => {}}>
          <SwitchOption value="test1">test 1</SwitchOption>
          <SwitchOption value="test2">test 2</SwitchOption>
          <SwitchOption value="test3">test 3</SwitchOption>
        </Switch>
      </div>
      <div>
        <h3>Toggle</h3>
        <Toggle label="Test toggle" />
      </div>
    </TabPanel>
  );
};
