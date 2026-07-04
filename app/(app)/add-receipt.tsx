import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DateInput } from "../../src/components/DateInput";
import { FridgeTagSelector } from "../../src/components/FridgeTagSelector";
import { useI18n } from "../../src/i18n/I18nProvider";
import { sendAssistantPrompt } from "../../src/lib/assistant";
import {
  addFridgeItem,
  QUANTITY_TYPES,
  type QuantityType,
} from "../../src/lib/firestore/fridgeItems";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
};

type ItemDraft = {
  sourceId: string;
  name: string;
  description: string;
  quantity: string;
  quantityType: QuantityType;
  expirationDate: string;
  calories: string;
  imageUrl: string;
  tags: string[];
};

const RECEIPT_PROMPT =
  "From this receipt read all the items and send back a list of jsons with attribute name, quantity. Return only a JSON array.";

export default function AddReceiptScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [receiptImage, setReceiptImage] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [isQuantityTypeOpen, setIsQuantityTypeOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadReceipt = async () => {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("add.upload.permission_denied");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    const uri = result.canceled ? null : result.assets?.[0]?.uri;
    if (!uri) return;

    setIsReading(true);
    try {
      const image = await imageToDataUrl(uri);
      setReceiptImage(image);
      const response = await sendAssistantPrompt(RECEIPT_PROMPT, { images: [image] });
      setItems(parseReceiptItems(response));
    } catch {
      setError("receipt.error_read");
    } finally {
      setIsReading(false);
    }
  };

  const selectItem = (item: ReceiptItem) => {
    setError("");
    setDraft({
      sourceId: item.id,
      name: item.name,
      description: "",
      quantity: String(item.quantity),
      quantityType: "unit",
      expirationDate: "",
      calories: "0",
      imageUrl: "",
      tags: [],
    });
  };

  const saveItem = async () => {
    if (!user || !draft) return;
    const quantity = Number(draft.quantity);
    const calories = Number(draft.calories);
    if (
      draft.name.trim().length < 2 ||
      draft.description.trim().length < 2 ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(draft.expirationDate) ||
      !Number.isFinite(calories) ||
      calories < 0
    ) {
      setError("receipt.validation.item");
      return;
    }

    setIsSaving(true);
    try {
      await addFridgeItem(user.id, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        quantity,
        quantityType: draft.quantityType,
        expirationDate: draft.expirationDate,
        calories,
        imageUrl: draft.imageUrl.trim(),
        imageSerialized: receiptImage,
        tags: draft.tags,
      });
      setItems((current) => current.filter((item) => item.id !== draft.sourceId));
      setDraft(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>{t("receipt.title")}</Text>
        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{t("add.cancel")}</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{t("receipt.subtitle")}</Text>
      <Pressable onPress={uploadReceipt} disabled={isReading} style={styles.uploadButton}>
        <Text style={styles.uploadText}>{t("receipt.upload")}</Text>
      </Pressable>
      {isReading ? <ActivityIndicator color={colors.primary} /> : null}
      {receiptImage ? <Image source={{ uri: receiptImage }} style={styles.receiptImage} /> : null}
      {items.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t("receipt.items")}</Text>
          <View style={styles.chips}>
            {items.map((item) => (
              <Pressable key={item.id} onPress={() => selectItem(item)} style={styles.chip}>
                <Text style={styles.chipText}>{item.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {draft ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{t("receipt.complete_item")}</Text>
          <Field label={t("fridge_add.label.name")} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
          <Field label={t("fridge_add.label.description")} value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
          <Field label={t("fridge_add.label.quantity")} value={draft.quantity} onChange={(quantity) => setDraft({ ...draft, quantity })} numeric />
          <Field label={t("fridge_add.label.calories")} value={draft.calories} onChange={(calories) => setDraft({ ...draft, calories })} numeric />
          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.expiration_date")}</Text>
            <DateInput
              value={draft.expirationDate}
              onChange={(expirationDate) => setDraft({ ...draft, expirationDate })}
              placeholder={t("fridge_add.placeholder.expiration_date")}
            />
          </View>
          <Field label={t("fridge_add.label.image")} value={draft.imageUrl} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.quantity_type")}</Text>
            <Pressable onPress={() => setIsQuantityTypeOpen((open) => !open)} style={styles.input}>
              <Text style={styles.inputText}>{draft.quantityType}</Text>
            </Pressable>
            {isQuantityTypeOpen ? QUANTITY_TYPES.map((type) => (
              <Pressable key={type} onPress={() => { setDraft({ ...draft, quantityType: type }); setIsQuantityTypeOpen(false); }} style={styles.option}>
                <Text style={styles.inputText}>{type}</Text>
              </Pressable>
            )) : null}
          </View>
          <FridgeTagSelector ownerId={user?.id ?? null} selectedTags={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} />
          <Pressable onPress={saveItem} disabled={isSaving} style={styles.saveButton}>
            {isSaving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveText}>{t("fridge_add.save")}</Text>}
          </Pressable>
        </View>
      ) : null}
      {items.length === 0 && receiptImage && !isReading ? <Text style={styles.subtitle}>{t("receipt.done")}</Text> : null}
      {error ? <Text style={styles.error}>{t(error)}</Text> : null}
    </ScrollView>
  );
}

function Field({ label, value, onChange, numeric = false }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={numeric ? "numeric" : "default"} style={styles.input} /></View>;
}

async function imageToDataUrl(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1400 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) throw new Error("Receipt image could not be loaded.");
  return `data:image/jpeg;base64,${result.base64}`;
}

function parseReceiptItems(response: string): ReceiptItem[] {
  const match = response.match(/\[[\s\S]*\]/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item, index) => ({
    id: `${index}-${String(item.name ?? "")}`,
    name: String(item.name ?? "").trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
  })).filter((item) => item.name);
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { color: colors.text, ...typography.h1 },
  subtitle: { color: colors.muted, ...typography.body },
  section: { gap: spacing.sm },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  chipText: { color: colors.text, ...typography.body },
  uploadButton: { alignSelf: "flex-start", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.primary },
  uploadText: { color: colors.background, ...typography.body },
  receiptImage: { width: "100%", height: 220, borderRadius: radius.md, backgroundColor: colors.card },
  form: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  formTitle: { color: colors.text, ...typography.h2 },
  field: { gap: spacing.xs },
  input: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  inputText: { color: colors.text, ...typography.body },
  option: { padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.card },
  saveButton: { alignItems: "center", padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.accent },
  saveText: { color: colors.background, ...typography.h2 },
  cancelButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  cancelText: { color: colors.primary, ...typography.body },
  error: { color: colors.danger, ...typography.caption },
});
