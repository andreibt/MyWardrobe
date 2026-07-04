import { InventoryRestoreScreen } from "../../src/components/InventoryRestoreScreen";
import { useI18n } from "../../src/i18n/I18nProvider";

export default function RestorePantryItemScreen() {
  const { t } = useI18n();

  return (
    <InventoryRestoreScreen
      kind="pantry"
      title={t("pantry.restore_title")}
      buttonLabel={t("pantry.restore_button")}
      returnPath="/(app)/(pantry)/pantry"
    />
  );
}
