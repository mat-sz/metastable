import styles from './VarLabelActions.module.scss';

export interface IVarLabelActionsProps {
  label?: React.ReactNode;
  actions?: React.ReactNode;
}

export const VarLabelActions = ({
  label,
  actions,
}: IVarLabelActionsProps): JSX.Element => {
  return (
    <div className={styles.wrapper}>
      <span className={styles.title}>{label}</span>
      <span className={styles.actions}>{actions}</span>
    </div>
  );
};
