import { observer } from 'mobx-react-lite';

import { IVarAddModelProps, VarAddModel } from '$components/var';
import { useSimpleProject } from '../../context';

interface IVarProjectModelProps
  extends Omit<IVarAddModelProps, 'architecture'> {
  shouldFilterByArchitecture?: boolean;
}

export const VarProjectAddModel = observer(
  ({
    shouldFilterByArchitecture,
    ...props
  }: IVarProjectModelProps): JSX.Element => {
    const project = useSimpleProject();

    return (
      <VarAddModel
        {...props}
        architecture={
          shouldFilterByArchitecture ? project.architecture : undefined
        }
      />
    );
  },
);
