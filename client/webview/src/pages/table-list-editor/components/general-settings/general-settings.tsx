import { memo } from 'react';
import TableDescription from '../table-description/table-description';
import TableFillType from '../table-fill-type/table-fill-type';
import TableName from '../table-name/table-name';
import styles from './general-settings.module.scss';

function GeneralSettings() {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <TableName />
        <div className={styles.splitBox}>
          <TableDescription language="ru" />
          <TableDescription language="en" />
        </div>
        <TableFillType />
      </div>
    </div>
  );
}

export default memo(GeneralSettings);
