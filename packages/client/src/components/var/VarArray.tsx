import { clone, get, set } from 'radash';
import { ReactNode } from 'react';

import { useVarUIValue, VarUIContext } from './common/VarUIContext';
import { IVarBaseInputProps } from './VarBase';

export interface IVarArrayProps<T = any>
  extends Omit<IVarBaseInputProps<T[]>, 'label' | 'children' | 'readOnly'> {
  children?: ReactNode | ((element: T, index: number, array: T[]) => ReactNode);
}

/**
 * Array input component.
 */
export const VarArray = ({
  path,
  value,
  onChange,
  className,
  children,
  error,
  errorPath,
}: IVarArrayProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  return (
    <div className={className ?? ''}>
      {currentValue?.map((element, index, array) => {
        return (
          <VarUIContext.Provider
            value={{
              values: element,
              getValue: (path?: string) =>
                typeof path === 'string' ? get(element, path) : undefined,
              setValue: (path: string, newValue: any) => {
                const newArray = [...currentValue];
                newArray[index] =
                  path === '' ? newValue : set(clone(element), path, newValue);
                setCurrentValue(newArray);
              },
              getError: (path?: string) => {
                const elementError = currentError?.[index];
                return elementError && path
                  ? get(elementError, path)
                  : undefined;
              },
            }}
            key={index}
          >
            {typeof children === 'function'
              ? children(element, index, array)
              : children}
          </VarUIContext.Provider>
        );
      })}
    </div>
  );
};
