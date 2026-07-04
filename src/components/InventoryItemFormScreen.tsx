import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useI18n } from "../i18n/I18nProvider";
import { dismissToOrReplace, goBackOrReplace } from "../lib/navigation";
import {
  addInventoryItem,
  updateInventoryItem,
  type InventoryItem,
  type InventoryKind,
} from "../lib/firestore/inventoryItems";
import { QUANTITY_TYPES, type QuantityType } from "../lib/firestore/fridgeItems";
import { useAuth } from "../providers/AuthProvider";
import { useTheme, type AppTheme } from "../providers/ThemeProvider";
import { spacing, typography } from "../theme/tokens";
import { DateInput } from "./DateInput";

type InventoryItemFormScreenProps = {
  kind: InventoryKind;
  mode: "add" | "edit";
  initialItem?: Partial<InventoryItem> & { id?: string };
  title: string;
  saveLabel: string;
  returnPath: "/(app)/(pantry)/pantry" | "/(app)/(cocktails)/cocktails";
};

type ItemForm = {
  name: string;
  description: string;
  quantity: number;
  expirationDate: string;
  calories: number;
  imageUrl: string;
  tags: string;
};

type CompressionStep = { quality: number; maxWidth?: number };

const itemSchema = z.object({
  name: z.string().min(2, "fridge_add.validation.name"),
  description: z.string().min(2, "fridge_add.validation.description"),
  quantity: z.coerce.number().positive("fridge_add.validation.quantity"),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fridge_add.validation.expiration_date"),
  calories: z.coerce.number().min(0, "fridge_add.validation.calories"),
  imageUrl: z.union([z.literal(""), z.string().url("validation.image_url_invalid")]),
  tags: z.string(),
});

const COMPRESSION_STEPS: CompressionStep[] = [
  { quality: 0.8 },
  { maxWidth: 1600, quality: 0.75 },
  { maxWidth: 1200, quality: 0.65 },
  { maxWidth: 900, quality: 0.55 },
  { maxWidth: 700, quality: 0.45 },
];
const MAX_IMAGE_BYTES = 900_000;

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

export function InventoryItemFormScreen({
  kind,
  mode,
  initialItem,
  title,
  saveLabel,
  returnPath,
}: InventoryItemFormScreenProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, kind), [kind, theme]);
  const colors = theme.colors;
  const [quantityType, setQuantityType] = useState<QuantityType>(
    QUANTITY_TYPES.includes(initialItem?.quantityType as QuantityType)
      ? (initialItem?.quantityType as QuantityType)
      : "unit"
  );
  const [isQuantityTypeOpen, setIsQuantityTypeOpen] = useState(false);
  const [imageSerialized, setImageSerialized] = useState(initialItem?.imageSerialized ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initialItem?.name ?? "",
      description: initialItem?.description ?? "",
      quantity: Number(initialItem?.quantity ?? 1),
      expirationDate: initialItem?.expirationDate ?? "",
      calories: Number(initialItem?.calories ?? 0),
      imageUrl: initialItem?.imageUrl ?? "",
      tags: initialItem?.tags?.join(", ") ?? "",
    },
  });
  const isBusy = isSubmitting || isImageProcessing;
  const imagePreviewUri = imageSerialized || watch("imageUrl");
  const showCalories = kind === "cocktails";

  const onSubmit = async (data: ItemForm) => {
    if (!data.imageUrl && !imageSerialized) {
      setImageError("fridge_add.validation.image");
      return;
    }
    const tags = data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, list) => list.indexOf(tag) === index);
    const payload = {
      name: data.name,
      description: data.description,
      quantity: Number(data.quantity),
      quantityType,
      expirationDate: data.expirationDate,
      ...(showCalories ? { calories: Number(data.calories) } : {}),
      imageUrl: data.imageUrl,
      tags,
      ...(imageSerialized ? { imageSerialized } : {}),
    };

    if (mode === "add") {
      if (!user) return;
      await addInventoryItem(kind, user.id, payload);
    } else if (initialItem?.id) {
      await updateInventoryItem(kind, initialItem.id, payload);
    }
    dismissToOrReplace(router, returnPath);
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
      if (!uri) return;
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

  const fields: Array<{
    name: keyof ItemForm;
    label: string;
    placeholder: string;
    keyboardType?: "default" | "numeric";
    multiline?: boolean;
    hidden?: boolean;
  }> = [
    { name: "name", label: "fridge_add.label.name", placeholder: kind === "pantry" ? "Basmati rice" : "London dry gin" },
    {
      name: "description",
      label: "fridge_add.label.description",
      placeholder: kind === "pantry" ? "Long-grain pantry staple" : "Spirit for classic cocktails",
      multiline: true,
    },
    {
      name: "quantity",
      label: "fridge_add.label.quantity",
      placeholder: "2",
      keyboardType: "numeric",
    },
    {
      name: "calories",
      label: "fridge_add.label.calories",
      placeholder: "97",
      keyboardType: "numeric",
      hidden: !showCalories,
    },
    {
      name: "tags",
      label: "inventory.tags",
      placeholder: kind === "pantry" ? "Grains, Staple" : "Spirits, Premium",
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.navBar}>
          <Pressable
            onPress={() => goBackOrReplace(router, returnPath)}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("add.cancel")}
          >
            <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
          </Pressable>
          <Text style={styles.navTitle}>{title}</Text>
        </View>

        <Pressable
          onPress={handleUploadImage}
          disabled={isImageProcessing}
          style={({ pressed }) => [styles.photoUpload, pressed && styles.buttonPressed]}
        >
          {isImageProcessing ? (
            <ActivityIndicator color={colors.primary} />
          ) : imagePreviewUri ? (
            <Image source={{ uri: imagePreviewUri }} style={styles.photoPreview} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={kind === "pantry" ? "food-variant" : "glass-cocktail"}
                color={colors.muted}
                size={34}
              />
              <Text style={styles.uploadLabel}>{t("add.upload.button")}</Text>
              <Text style={styles.uploadHint}>{t("fridge_add.validation.image")}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.form}>
          {fields
            .filter((field) => !field.hidden)
            .map((field) => (
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
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.muted}
                      keyboardType={field.keyboardType}
                      multiline={field.multiline}
                      style={[styles.input, field.multiline && styles.multilineInput]}
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
              render={({ field: { onBlur, onChange, value } }) => (
                <DateInput
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  placeholder={t("fridge_add.placeholder.expiration_date")}
                />
              )}
            />
            {errors.expirationDate?.message ? (
              <Text style={styles.error}>{t(String(errors.expirationDate.message))}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.quantity_type")}</Text>
            <Pressable
              onPress={() => setIsQuantityTypeOpen((value) => !value)}
              style={({ pressed }) => [styles.dropdownButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.dropdownText}>{quantityType}</Text>
              <MaterialCommunityIcons
                name={isQuantityTypeOpen ? "chevron-up" : "chevron-down"}
                color={colors.textMuted}
                size={20}
              />
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
                    style={[
                      styles.dropdownOption,
                      option === quantityType && styles.dropdownOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        option === quantityType && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
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
                    setImageError(null);
                  }}
                  placeholder={t("fridge_add.placeholder.image")}
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  style={styles.input}
                />
              )}
            />
            {errors.imageUrl?.message ? (
              <Text style={styles.error}>{t(String(errors.imageUrl.message))}</Text>
            ) : null}
            <Pressable
              onPress={handleUploadImage}
              disabled={isImageProcessing}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
                isImageProcessing && styles.buttonDisabled,
              ]}
            >
              {isImageProcessing ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="image-plus" color={stylesVars(kind).accent} size={18} />
                  <Text style={styles.secondaryButtonText}>{t("add.upload.button")}</Text>
                </>
              )}
            </Pressable>
            {imageError ? <Text style={styles.error}>{t(imageError)}</Text> : null}
          </View>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
              isBusy && styles.buttonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.logoTint} />
            ) : (
              <Text style={styles.saveText}>{saveLabel}</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => goBackOrReplace(router, returnPath)}>
          <Text style={styles.cancelText}>{t("add.cancel")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stylesVars = (kind: InventoryKind) => ({
  accent: kind === "pantry" ? "#E8A838" : "#3BA4F5",
  dim: kind === "pantry" ? "rgba(232, 168, 56, 0.12)" : "rgba(59, 164, 245, 0.12)",
});

const createStyles = (theme: AppTheme, kind: InventoryKind) => {
  const colors = theme.colors;
  const vars = stylesVars(kind);

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, paddingHorizontal: 20, gap: spacing.lg },
    navBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    backButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    navTitle: { flex: 1, color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: "600" },
    photoUpload: {
      width: "100%",
      aspectRatio: 4 / 3,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      overflow: "hidden",
      borderRadius: 18,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: vars.accent,
      backgroundColor: vars.dim,
    },
    photoPreview: { width: "100%", height: "100%" },
    uploadLabel: { color: colors.textMuted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
    uploadHint: { color: colors.muted, fontSize: 11, lineHeight: 15, textAlign: "center", paddingHorizontal: spacing.lg },
    form: { gap: spacing.md },
    field: { gap: spacing.xs },
    label: { color: colors.textMuted, ...typography.caption, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "600" },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: 15,
      lineHeight: 20,
    },
    multilineInput: { minHeight: 96, textAlignVertical: "top" },
    dropdownButton: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
    },
    dropdownText: { color: colors.text, ...typography.body },
    dropdownOptions: { overflow: "hidden", borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    dropdownOption: { paddingVertical: 12, paddingHorizontal: 14 },
    dropdownOptionActive: { backgroundColor: vars.accent },
    dropdownOptionText: { color: colors.text, ...typography.body },
    dropdownOptionTextActive: { color: colors.logoTint, fontWeight: "700" },
    secondaryButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    secondaryButtonText: { color: vars.accent, ...typography.body, fontWeight: "600" },
    error: { color: colors.danger, ...typography.caption },
    saveButton: { marginTop: spacing.sm, alignItems: "center", paddingVertical: 15, borderRadius: 10, backgroundColor: vars.accent },
    saveText: { color: colors.logoTint, ...typography.h2 },
    cancelText: { color: vars.accent, textAlign: "center", ...typography.body },
    buttonPressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.6 },
  });
};
