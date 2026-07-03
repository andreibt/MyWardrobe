import { InventoryListScreen } from "../../../src/components/InventoryListScreen";
import { useI18n } from "../../../src/i18n/I18nProvider";

export default function CocktailsScreen() {
  const { t } = useI18n();

  return (
    <InventoryListScreen
      kind="cocktails"
      copy={{
        title: t("cocktails.title"),
        getActiveCount: (count) => t("cocktails.count", { count }),
        searchPlaceholder: t("cocktails.search_placeholder"),
        allFilter: t("cocktails.filter_all"),
        empty: t("cocktails.empty"),
        emptyHistory: t("cocktails.empty_history"),
        emptyFiltered: t("cocktails.empty_filtered"),
        emptySubtitle: t("cocktails.empty_subtitle"),
        deleteTitle: t("cocktails.delete_title"),
        deleteMessage: t("cocktails.delete_message"),
        deleteButton: t("cocktails.delete_button"),
        addButton: t("cocktails.add_button"),
        icon: "glass-cocktail",
        addPath: "/(app)/add-cocktail-item",
        editPath: "/(app)/edit-cocktail-item",
        restorePath: "/(app)/restore-cocktail-item",
      }}
    />
  );
}
