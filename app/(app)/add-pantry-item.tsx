import { InventoryItemFormScreen } from "../../src/components/InventoryItemFormScreen";
import { useI18n } from "../../src/i18n/I18nProvider";

export default function AddPantryItemScreen() {
  const { t } = useI18n();

  return (
    <InventoryItemFormScreen
      kind="pantry"
      mode="add"
      title={t("pantry.add_title")}
      saveLabel={t("pantry.save")}
      returnPath="/(app)/(pantry)/pantry"
    />
  );
}
