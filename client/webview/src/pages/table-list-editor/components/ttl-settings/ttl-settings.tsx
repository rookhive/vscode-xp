import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { useTranslations } from '~/hooks/use-translations';
import Checkbox from '~/ui/checkbox/checkbox';
import Label from '~/ui/label/label';
import Textfield from '~/ui/textfield/textfield';
import { state, useActions, useEditor } from '../../store';
import SettingBox from '../setting-box/setting-box';
import styles from './ttl-settings.module.scss';

function TTLSettings() {
  const {
    data: { ttl }
  } = useEditor();
  const translations = useTranslations();
  const { setTTL, parseTTL, toggleTTLUse } = useActions();
  const errors = useSnapshot(state.errors.general);
  const [isTTLUsed, setIsTTLUsed] = useState(!!ttl);
  const [days, hours, minutes] = useMemo(() => parseTTL(ttl!), [ttl, parseTTL]);

  const handleTTLUse = (isTTLUsed: boolean) => {
    toggleTTLUse(isTTLUsed);
    setIsTTLUsed(isTTLUsed);
  };

  return (
    <SettingBox>
      <Label>{translations.TTL}</Label>
      <div className={styles.content}>
        <Checkbox
          label={translations.RestrictTTL}
          isChecked={isTTLUsed}
          onChange={() => handleTTLUse(!isTTLUsed)}
        />
        <div className={styles.form}>
          <Textfield
            type="number"
            min={0}
            max={90}
            value={days}
            isDisabled={!isTTLUsed}
            errorMessage={errors.ttlDays || errors.ttl}
            onChange={(days) => setTTL(Number(days || 0), hours, minutes)}
          />
          <span>{translations.TTLDays}</span>
          <Textfield
            type="number"
            min={0}
            max={23}
            value={hours}
            isDisabled={!isTTLUsed}
            errorMessage={errors.ttlHours || errors.ttl}
            onChange={(hours) => setTTL(days, Number(hours || 0), minutes)}
          />
          <span>{translations.TTLHours}</span>
          <Textfield
            type="number"
            min={0}
            max={59}
            value={minutes}
            isDisabled={!isTTLUsed}
            errorMessage={errors.ttlMinutes || errors.ttl}
            onChange={(minutes) => setTTL(days, hours, Number(minutes || 0))}
          />
          <span>{translations.TTLMinutes}</span>
        </div>
      </div>
    </SettingBox>
  );
}

export default TTLSettings;
