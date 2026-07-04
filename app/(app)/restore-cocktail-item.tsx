import { InventoryRestoreScreen } from "../../src/components/InventoryRestoreScreen";
import { useI18n } from "../../src/i18n/I18nProvider";

export default function RestoreCocktailItemScreen() {
  const { t } = useI18n();

  return (
    <InventoryRestoreScreen
      kind="cocktails"
      title={t("cocktails.restore_title")}
      buttonLabel={t("cocktails.restore_button")}
      returnPath="/(app)/(cocktails)/cocktails"
    />
  );
}
