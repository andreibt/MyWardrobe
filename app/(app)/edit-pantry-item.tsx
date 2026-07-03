import { useLocalSearchParams } from "expo-router";

import { InventoryItemFormScreen } from "../../src/components/InventoryItemFormScreen";
import { useI18n } from "../../src/i18n/I18nProvider";
import type { InventoryItem } from "../../src/lib/firestore/inventoryItems";
import type { QuantityType } from "../../src/lib/firestore/fridgeItems";

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";
const parseTags = (value: string | string[] | undefined) => {
  try {
    const parsed = JSON.parse(getParam(value));
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === "string") : [];
  } catch {
    return [];
  }
};

export default function EditPantryItemScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const initialItem: Partial<InventoryItem> & { id: string } = {
    id: getParam(params.id),
    name: getParam(params.name),
    description: getParam(params.description),
    quantity: Number(getParam(params.quantity)),
    quantityType: getParam(params.quantityType) as QuantityType,
    expirationDate: getParam(params.expirationDate),
    imageUrl: getParam(params.imageUrl),
    imageSerialized: getParam(params.imageSerialized),
    tags: parseTags(params.tags),
  };

  return (
    <InventoryItemFormScreen
      kind="pantry"
      mode="edit"
      initialItem={initialItem}
      title={t("pantry.edit_title")}
      saveLabel={t("pantry.save_changes")}
      returnPath="/(app)/(pantry)/pantry"
    />
  );
}
