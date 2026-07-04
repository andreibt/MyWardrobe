import { InventoryListScreen } from "../../../src/components/InventoryListScreen";
import { useI18n } from "../../../src/i18n/I18nProvider";

export default function PantryScreen() {
  const { t } = useI18n();

  return (
    <InventoryListScreen
      kind="pantry"
      copy={{
        title: t("pantry.title"),
        getActiveCount: (count) => t("home.dashboard.items", { count }),
        searchPlaceholder: t("pantry.search_placeholder"),
        allFilter: t("pantry.filter_all"),
        empty: t("pantry.empty"),
        emptyHistory: t("pantry.empty_history"),
        emptyFiltered: t("pantry.empty_filtered"),
        emptySubtitle: t("pantry.empty_subtitle"),
        deleteTitle: t("pantry.delete_title"),
        deleteMessage: t("pantry.delete_message"),
        deleteButton: t("pantry.delete_button"),
        addButton: t("pantry.add_button"),
        icon: "food-variant",
        addPath: "/(app)/add-pantry-item",
        editPath: "/(app)/edit-pantry-item",
      }}
    />
  );
}
