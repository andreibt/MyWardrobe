import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
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
  addFridgeItem,
  QUANTITY_TYPES,
  type QuantityType,
} from "../../src/lib/firestore/fridgeItems";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const itemSchema = z.object({
  name: z.string().min(2, "fridge_add.validation.name"),
  description: z.string().min(2, "fridge_add.validation.description"),
  quantity: z.coerce.number().positive("fridge_add.validation.quantity"),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "fridge_add.validation.expiration_date"),
  calories: z.coerce.number().min(0, "fridge_add.validation.calories"),
  imageUrl: z.union([z.literal(""), z.string().url("validation.image_url_invalid")]),
});

type ItemForm = z.infer<typeof itemSchema>;
type CompressionStep = { quality: number; maxWidth?: number };

const MAX_IMAGE_BYTES = 900_000;
const COMPRESSION_STEPS: CompressionStep[] = [
  { quality: 0.8 },
  { maxWidth: 1600, quality: 0.75 },
  { maxWidth: 1200, quality: 0.65 },
  { maxWidth: 900, quality: 0.55 },
  { maxWidth: 700, quality: 0.45 },
];

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

export default function AddFridgeItemScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [quantityType, setQuantityType] = useState<QuantityType>("unit");
  const [isQuantityTypeOpen, setIsQuantityTypeOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [imageSerialized, setImageSerialized] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: 1,
      expirationDate: "",
      calories: 0,
      imageUrl: "",
    },
  });
  const isBusy = isSubmitting || isImageProcessing;

  const onSubmit = async (data: ItemForm) => {
    if (!user) {
      return;
    }
    if (!data.imageUrl && !imageSerialized) {
      setImageError("fridge_add.validation.image");
      return;
    }
    await addFridgeItem(user.id, {
      ...data,
      quantityType,
      tags,
      ...(imageSerialized ? { imageSerialized } : {}),
    });
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
      if (result.canceled) {
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        setImageError("add.upload.load_error");
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

  const fields: Array<{
    name: keyof ItemForm;
    label: string;
    placeholder: string;
    keyboardType?: "default" | "numeric";
  }> = [
    { name: "name", label: "fridge_add.label.name", placeholder: "fridge_add.placeholder.name" },
    {
      name: "description",
      label: "fridge_add.label.description",
      placeholder: "fridge_add.placeholder.description",
    },
    {
      name: "quantity",
      label: "fridge_add.label.quantity",
      placeholder: "fridge_add.placeholder.quantity",
      keyboardType: "numeric",
    },
    {
      name: "calories",
      label: "fridge_add.label.calories",
      placeholder: "fridge_add.placeholder.calories",
      keyboardType: "numeric",
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("fridge_add.title")}</Text>
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
                    placeholder={t(field.placeholder)}
                    placeholderTextColor={colors.muted}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.name === "imageUrl" ? "none" : undefined}
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
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder={t("fridge_add.placeholder.expiration_date")}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                )
              }
            />
            {errors.expirationDate?.message ? (
              <Text style={styles.error}>{t(String(errors.expirationDate.message))}</Text>
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
            {isImageProcessing ? (
              <ActivityIndicator color={colors.primary} />
            ) : imageSerialized ? (
              <Image source={{ uri: imageSerialized }} style={styles.previewImage} />
            ) : null}
            <Pressable
              onPress={handleUploadImage}
              disabled={isImageProcessing}
              style={[styles.uploadButton, isImageProcessing && styles.disabled]}
            >
              <Text style={styles.uploadText}>{t("add.upload.button")}</Text>
            </Pressable>
            {imageError ? <Text style={styles.error}>{t(imageError)}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("fridge_add.label.quantity_type")}</Text>
            <Pressable
              onPress={() => setIsQuantityTypeOpen((value) => !value)}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownText}>{quantityType}</Text>
              <Text style={styles.dropdownText}>{isQuantityTypeOpen ? "^" : "v"}</Text>
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
                    <Text style={styles.dropdownText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <FridgeTagSelector ownerId={user?.id ?? null} selectedTags={tags} onChange={setTags} />

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isBusy}
            style={[styles.saveButton, isBusy && styles.disabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.saveText}>{t("fridge_add.save")}</Text>
            )}
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>{t("add.cancel")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, ...typography.h1 },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  field: { gap: spacing.xs },
  label: { color: colors.text, ...typography.caption, textTransform: "uppercase" },
  input: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.card,
  },
  webDateInput: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.card,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  uploadButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadText: { color: colors.primary, ...typography.body },
  error: { color: colors.danger, ...typography.caption },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  dropdownOptions: {
    overflow: "hidden",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownOption: { padding: spacing.sm, backgroundColor: colors.card },
  dropdownOptionActive: { backgroundColor: colors.primary },
  dropdownText: { color: colors.text, ...typography.body },
  saveButton: {
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  saveText: { color: colors.background, ...typography.h2 },
  disabled: { opacity: 0.6 },
  cancelText: { color: colors.primary, textAlign: "center", ...typography.body },
});
