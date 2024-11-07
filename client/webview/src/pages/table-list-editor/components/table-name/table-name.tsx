import { memo } from 'react';
import { useSnapshot } from 'valtio';
import { useTranslations } from '~/hooks/use-translations';
import Label from '~/ui/label/label';
import Textfield from '~/ui/textfield/textfield';
import { state, useActions, useEditor } from '../../store';
import SettingBox from '../setting-box/setting-box';

function TableName() {
  const {
    data: { name }
  } = useEditor();
  const translations = useTranslations();
  const errors = useSnapshot(state.errors.general);
  const { setName } = useActions();

  return (
    <SettingBox>
      <Label isRequired>{translations.Name}</Label>
      <Textfield isRequired value={name} onChange={setName} errorMessage={errors.tableName} />
    </SettingBox>
  );
}

export default memo(TableName);
