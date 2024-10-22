import { observer } from 'mobx-react-lite';

import { IVarModelProps, VarModel } from '$components/var';
import { useSimpleProject } from '../../context';

interface IVarProjectModelProps extends Omit<IVarModelProps, 'architecture'> {
  shouldFilterByArchitecture?: boolean;
}

export const VarProjectModel = observer(
  ({
    shouldFilterByArchitecture,
    ...props
  }: IVarProjectModelProps): JSX.Element => {
    const project = useSimpleProject();

    return (
      <VarModel
        {...props}
        architecture={
          shouldFilterByArchitecture ? project.architecture : undefined
        }
      />
    );
  },
);
