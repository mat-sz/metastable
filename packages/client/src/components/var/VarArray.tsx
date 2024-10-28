import { clone, get, set } from 'radash';
import { ReactNode } from 'react';

import { useVarUIValue, VarUIContext } from './common/VarUIContext';
import { IVarBaseInputProps } from './VarBase';

interface VarArrayItemContext<T> {
  element: T;
  index: number;
  array: T[];
  remove(): void;
}

interface VarArrayFooterContext<T> {
  append(item: T): void;
}

export interface IVarArrayProps<T = any>
  extends Omit<IVarBaseInputProps<T[]>, 'label' | 'children' | 'readOnly'> {
  children?: ReactNode | ((context: VarArrayItemContext<T>) => ReactNode);
  footer?: ReactNode | ((context: VarArrayFooterContext<T>) => ReactNode);
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
  footer,
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

  const currentArray = currentValue || [];

  return (
    <div className={className ?? ''}>
      {currentArray.map((element, index, array) => {
        return (
          <VarUIContext.Provider
            value={{
              values: element,
              getValue: (path?: string) =>
                typeof path === 'string' ? get(element, path) : undefined,
              setValue: (path: string, newValue: any) => {
                const newArray = [...currentArray];
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
              ? children({
                  element,
                  index,
                  array,
                  remove: () => {
                    const newArray = [...currentArray];
                    newArray.splice(index, 1);
                    setCurrentValue(newArray);
                  },
                })
              : children}
          </VarUIContext.Provider>
        );
      })}
      {typeof footer !== 'undefined' &&
        (typeof footer === 'function'
          ? footer({
              append: item => {
                setCurrentValue([...currentArray, item]);
              },
            })
          : footer)}
    </div>
  );
};
