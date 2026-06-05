import { zodResolver } from "@hookform/resolvers/zod";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { FridgeTagSelector } from "../../src/components/FridgeTagSelector";
import { useI18n } from "../../src/i18n/I18nProvider";
import {
  QUANTITY_TYPES,
  updateFridgeItem,
  type QuantityType,
} from "../../src/lib/firestore/fridgeItems";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const itemSchema = z.object({
  name: z.string().min(2, "fridge_add.validation.name"),
  description: z.string().min(2, "fridge_add.validation.description"),
  quantity: z.coerce.number().positive("fridge_add.validation.quantity"),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fridge_add.validation.expiration_date"),
  calories: z.coerce.number().min(0, "fridge_add.validation.calories"),
  imageUrl: z.union([z.literal(""), z.string().url("validation.image_url_invalid")]),
});

type ItemForm = z.infer<typeof itemSchema>;
type CompressionStep = { quality: number; maxWidth?: number };

const COMPRESSION_STEPS: CompressionStep[] = [
  { quality: 0.8 },
  { maxWidth: 1600, quality: 0.75 },
  { maxWidth: 1200, quality: 0.65 },
  { maxWidth: 900, quality: 0.55 },
  { maxWidth: 700, quality: 0.45 },
];
const MAX_IMAGE_BYTES = 900_000;
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
const getBase64Size = (base64: string) => {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};
const compressImageToDataUrl = async (uri: string) => {
  for (const step of COMPRESSION_STEPS) {
    const actions = step.maxWidth ? [{ resize: { width: step.maxWidth } }] : [];
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: step.quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (result.base64 && getBase64Size(result.base64) <= MAX_IMAGE_BYTES) {
      return `data:image/jpeg;base64,${result.base64}`;
    }
  }
  return null;
};

export default function EditFridgeItemScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const itemId = getParam(params.id);
  const initialImageSerialized = getParam(params.imageSerialized);
  const [quantityType, setQuantityType] = useState<QuantityType>(
    QUANTITY_TYPES.includes(getParam(params.quantityType) as QuantityType)
      ? (getParam(params.quantityType) as QuantityType)
      : "unit"
  );
  const [isQuantityTypeOpen, setIsQuantityTypeOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(parseTags(params.tags));
  const [imageSerialized, setImageSerialized] = useState(initialImageSerialized);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: getParam(params.name),
      description: getParam(params.description),
      quantity: Number(getParam(params.quantity)),
      expirationDate: getParam(params.expirationDate),
      calories: Number(getParam(params.calories)),
      imageUrl: getParam(params.imageUrl),
    },
  });
  const isBusy = isSubmitting || isImageProcessing;

  const onSubmit = async (data: ItemForm) => {
    if (!itemId || (!data.imageUrl && !imageSerialized)) {
      if (!data.imageUrl && !imageSerialized) {
        setImageError("fridge_add.validation.image");
      }
      return;
    }
    await updateFridgeItem(itemId, { ...data, quantityType, tags, imageSerialized });
    router.replace("/(app)/(fridge)/fridge-list");
  };

  const handleUploadImage = async () => {
    setImageError(null);
    setIsImageProcessing(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setImageError("add.upload.permission_denied");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      const uri = result.canceled ? null : result.assets?.[0]?.uri;
      if (!uri) {
        return;
      }
      const dataUrl = await compressImageToDataUrl(uri);
      if (!dataUrl) {
        setImageError("add.image.too_large");
        return;
      }
      setImageSerialized(dataUrl);
    } catch {
      setImageError("add.upload.load_error");
    } finally {
      setIsImageProcessing(false);
    }
  };

  const fields: Array<{ name: keyof ItemForm; label: string; keyboardType?: "numeric" }> = [
    { name: "name", label: "fridge_add.label.name" },
    { name: "description", label: "fridge_add.label.description" },
    { name: "quantity", label: "fridge_add.label.quantity", keyboardType: "numeric" },
    { name: "calories", label: "fridge_add.label.calories", keyboardType: "numeric" },
  ];

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("fridge_edit.title")}</Text>
        <View style={styles.card}>
          {fields.map((field) => (
            <View key={field.name} style={styles.field}>
              <Text style={styles.label}>{t(field.label)}</Text>
              <Controller
                control={control}
                name={field.name}
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    value={String(value)}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType={field.keyboardType}
                    style={styles.input}
                  />
                )}
              />
              {errors[field.name]?.message ? (
                <Text style={styles.error}>{t(String(errors[field.name]?.message))}</Text>
              ) : null}
            </View>
          ))}
          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.expiration_date")}</Text>
            <Controller
              control={control}
              name="expirationDate"
              render={({ field: { onBlur, onChange, value } }) =>
                Platform.OS === "web" ? (
                  <input
                    type="date"
                    value={value}
                    onBlur={onBlur}
                    onChange={(event) => onChange(event.target.value)}
                    style={styles.webDateInput}
                  />
                ) : (
                  <TextInput value={value} onBlur={onBlur} onChangeText={onChange} style={styles.input} />
                )
              }
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.quantity_type")}</Text>
            <Pressable onPress={() => setIsQuantityTypeOpen((value) => !value)} style={styles.input}>
              <Text style={styles.inputText}>{quantityType}</Text>
            </Pressable>
            {isQuantityTypeOpen ? (
              <View style={styles.dropdownOptions}>
                {QUANTITY_TYPES.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setQuantityType(option);
                      setIsQuantityTypeOpen(false);
                    }}
                    style={styles.dropdownOption}
                  >
                    <Text style={styles.inputText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.image")}</Text>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(nextValue) => {
                    onChange(nextValue);
                    setImageSerialized("");
                  }}
                  style={styles.input}
                />
              )}
            />
            {imageSerialized ? <Image source={{ uri: imageSerialized }} style={styles.previewImage} /> : null}
            <Pressable onPress={handleUploadImage} style={styles.uploadButton}>
              <Text style={styles.uploadText}>{t("add.upload.button")}</Text>
            </Pressable>
            {imageError ? <Text style={styles.error}>{t(imageError)}</Text> : null}
          </View>
          <FridgeTagSelector ownerId={user?.id ?? null} selectedTags={tags} onChange={setTags} />
          <Pressable onPress={handleSubmit(onSubmit)} disabled={isBusy} style={styles.saveButton}>
            {isBusy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveText}>{t("fridge_edit.save")}</Text>}
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>{t("edit.cancel")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, ...typography.h1 },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface },
  field: { gap: spacing.xs },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  input: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  inputText: { color: colors.text, ...typography.body },
  webDateInput: { padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  dropdownOptions: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  dropdownOption: { padding: spacing.sm, backgroundColor: colors.card },
  previewImage: { width: "100%", height: 180, borderRadius: radius.sm },
  uploadButton: { alignItems: "center", padding: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  uploadText: { color: colors.primary, ...typography.body },
  error: { color: colors.danger, ...typography.caption },
  saveButton: { alignItems: "center", padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.accent },
  saveText: { color: colors.background, ...typography.h2 },
  cancelText: { color: colors.primary, textAlign: "center", ...typography.body },
});
