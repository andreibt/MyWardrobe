import { InventoryItemFormScreen } from "../../src/components/InventoryItemFormScreen";
import { useI18n } from "../../src/i18n/I18nProvider";

export default function AddCocktailItemScreen() {
  const { t } = useI18n();

  return (
    <InventoryItemFormScreen
      kind="cocktails"
      mode="add"
      title={t("cocktails.add_title")}
      saveLabel={t("cocktails.save")}
      returnPath="/(app)/(cocktails)/cocktails"
    />
  );
}
