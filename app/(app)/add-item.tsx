import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TagSelector } from "../../src/components/TagSelector";
import { useI18n } from "../../src/i18n/I18nProvider";
import { addWardrobeItem } from "../../src/lib/firestore/wardrobeItems";
import {
  dismissToOrReplace,
  goBackOrReplace,
  WARDROBE_LIST_ROUTE,
} from "../../src/lib/navigation";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { radius, spacing, typography } from "../../src/theme/tokens";

const itemSchema = z.object({
  title: z.string().min(2, "validation.title_required"),
  description: z.string().min(4, "validation.description_required"),
  imageUrl: z.string().url("validation.image_url_invalid"),
  color: z.string().min(2, "validation.color_required"),
});

type ItemForm = z.infer<typeof itemSchema>;
type DriveErrorKey =
  | "add.drive.invalid_link"
  | "add.drive.request_failed"
  | "add.drive.no_images"
  | "add.drive.load_error"
  | "add.image.too_large"
  | "add.upload.permission_denied"
  | "add.upload.load_error";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
};

const MAX_IMAGE_BYTES = 900_000;
const COMPRESSION_STEPS: Array<{ quality: number; maxWidth?: number }> = [
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

const getDataUrlSize = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
  return getBase64Size(base64);
};

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader unavailable"));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read image"));
    };
    reader.readAsDataURL(blob);
  });

const compressImageToDataUrl = async (uri: string) => {
  for (const step of COMPRESSION_STEPS) {
    const actions = step.maxWidth ? [{ resize: { width: step.maxWidth } }] : [];
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: step.quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });

    if (!result.base64) {
      continue;
    }

    if (getBase64Size(result.base64) <= MAX_IMAGE_BYTES) {
      return `data:image/jpeg;base64,${result.base64}`;
    }
  }

  return null;
};

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      color: "",
    },
  });

  const [driveFolderLink, setDriveFolderLink] = useState("");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveError, setDriveError] = useState<DriveErrorKey | null>(null);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [imageSerialized, setImageSerialized] = useState("");
  const [isDriveLoadHidden, setIsDriveLoadHidden] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const isBusy = Boolean(isSubmitting || isImageProcessing);
  const driveApiKey = "AIzaSyBeO6ZDVcS5PRzXic4mfbCJkqPB1s0dBFc";

  const folderId = useMemo(() => {
    const match = driveFolderLink.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }, [driveFolderLink]);

  const onSubmit = async (data: ItemForm) => {
    if (!user) {
      return;
    }

    await addWardrobeItem(user.id, {
      ...data,
      tags,
      ...(imageSerialized ? { imageSerialized } : {}),
    });
    dismissToOrReplace(router, WARDROBE_LIST_ROUTE);
  };

  const handleLoadDriveFiles = async () => {
    if (!folderId) {
      setDriveError("add.drive.invalid_link");
      return;
    }

    setDriveError(null);
    setIsDriveLoading(true);
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
      const fields = encodeURIComponent(
        "files(id,name,mimeType,webContentLink,webViewLink,iconLink, thumbnailLink)"
      );
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${driveApiKey}`
      );

      if (!response.ok) {
        throw new Error("add.drive.request_failed");
      }

      const payload = await response.json();
      console.log(payload)
      const files = Array.isArray(payload.files) ? payload.files : [];
      const imageFiles = files.filter((file: { mimeType?: string }) =>
        String(file.mimeType || "").startsWith("image/")
      );
      setDriveFiles(imageFiles);
      if (imageFiles.length === 0) {
        setDriveError("add.drive.no_images");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "add.drive.request_failed") {
        setDriveError("add.drive.request_failed");
      } else {
        setDriveError("add.drive.load_error");
      }
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSelectDriveFile = async (file: DriveFile) => {
    if (!file.webContentLink) {
      setDriveError("add.drive.load_error");
      return;
    }
    setDriveError(null);
    setIsImageProcessing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file.webContentLink);
      if (!dataUrl) {
        setImageSerialized("");
        setDriveError("add.image.too_large");
        return;
      }
      setImageSerialized(dataUrl);
      setValue("imageUrl", file.webContentLink, { shouldValidate: true });
    } catch {
      try {
        const response = await fetch(file.webContentLink);
        if (!response.ok) {
          throw new Error("add.drive.load_error");
        }
        const blob = await response.blob();
        const dataUrl = await readBlobAsDataUrl(blob);
        if (getDataUrlSize(dataUrl) > MAX_IMAGE_BYTES) {
          setImageSerialized("");
          setDriveError("add.image.too_large");
          return;
        }
        setImageSerialized(dataUrl);
        setValue("imageUrl", file.webContentLink, { shouldValidate: true });
      } catch {
        setImageSerialized("");
        setDriveError("add.drive.load_error");
      }
    } finally {
      setIsImageProcessing(false);
    }
  };

  const handleUploadImage = async () => {
    setDriveError(null);
    setIsImageProcessing(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setDriveError("add.upload.permission_denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: false,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setDriveError("add.upload.load_error");
        return;
      }

      const dataUrl = await compressImageToDataUrl(asset.uri);
      if (!dataUrl) {
        setImageSerialized("");
        setDriveError("add.image.too_large");
        return;
      }
      setImageSerialized(dataUrl);
      setValue("imageUrl", 'localhost:8080', { shouldValidate: true });
      setDriveFiles([]);
      setDriveFolderLink("");
      setIsDriveLoadHidden(true);
    } catch {
      setDriveError("add.upload.load_error");
    } finally {
      setIsImageProcessing(false);
    }
  };

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
            onPress={() => goBackOrReplace(router, WARDROBE_LIST_ROUTE)}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t("add.cancel")}
          >
            <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
          </Pressable>
          <Text style={styles.navTitle}>{t("add.title")}</Text>
        </View>

        <Pressable
          onPress={handleUploadImage}
          disabled={Boolean(isImageProcessing)}
          style={({ pressed }) => [styles.photoUpload, pressed && styles.buttonPressed]}
        >
          {isImageProcessing ? (
            <ActivityIndicator color={colors.primary} />
          ) : imageSerialized ? (
            <Image source={{ uri: imageSerialized }} style={styles.photoPreview} />
          ) : (
            <>
              <MaterialCommunityIcons name="camera-plus-outline" color={colors.muted} size={34} />
              <Text style={styles.uploadLabel}>{t("add.upload.button")}</Text>
              <Text style={styles.uploadHint}>{t("add.subtitle")}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>{t("add.label.title")}</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder={t("add.placeholder.title")}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.title ? (
            <Text style={styles.error}>{t(errors.title.message ?? "")}</Text>
          ) : null}

          <Text style={styles.label}>{t("add.label.description")}</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder={t("add.placeholder.description")}
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.multilineInput]}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
              />
            )}
          />
          {errors.description ? (
            <Text style={styles.error}>{t(errors.description.message ?? "")}</Text>
          ) : null}

          <Text style={styles.label}>{t("add.label.image_url")}</Text>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder={t("add.placeholder.image_url")}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={(nextValue) => {
                  onChange(nextValue);
                  if (imageSerialized) {
                    setImageSerialized("");
                  }
                  if (isDriveLoadHidden) {
                    setIsDriveLoadHidden(false);
                  }
                  if (driveError) {
                    setDriveError(null);
                  }
                }}
                autoCapitalize="none"
              />
            )}
          />
          {errors.imageUrl ? (
            <Text style={styles.error}>{errors.imageUrl.message}</Text>
          ) : null}
          {isImageProcessing ? (
            <ActivityIndicator color={colors.primary} />
          ) : imageSerialized ? (
            <Image source={{ uri: imageSerialized }} style={styles.previewImage} />
          ) : null}

          <View style={styles.divider} />
          {!isDriveLoadHidden ? (
            <>
              <Text style={styles.label}>{t("add.label.drive")}</Text>
              <TextInput
                placeholder={t("add.placeholder.drive_url")}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={driveFolderLink}
                onChangeText={setDriveFolderLink}
                autoCapitalize="none"
              />
              <Pressable
                onPress={handleLoadDriveFiles}
                style={({ pressed }) => [
                  styles.button,
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  (isDriveLoading || isImageProcessing) && styles.buttonDisabled,
                ]}
                disabled={Boolean(isDriveLoading || isImageProcessing)}
              >
                {isDriveLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    {t("add.drive.load_button")}
                  </Text>
                )}
              </Pressable>
              {driveFiles.length > 0 ? (
                <View style={styles.driveGrid}>
                  {driveFiles.map((file) => (
                    <Pressable
                      key={file.id}
                      onPress={() => handleSelectDriveFile(file)}
                      style={styles.driveItem}
                      disabled={Boolean(isImageProcessing)}
                    >
                      {file.thumbnailLink ? (
                        <Image
                          source={{ uri: file.thumbnailLink }}
                          style={styles.driveImage}
                        />
                      ) : (
                        <View style={styles.drivePlaceholder} />
                      )}
                      <Text style={styles.driveLabel} numberOfLines={1}>
                        {file.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
          <Pressable
            onPress={handleUploadImage}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              isImageProcessing && styles.buttonDisabled,
            ]}
            disabled={Boolean(isImageProcessing)}
          >
            {isImageProcessing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>{t("add.upload.button")}</Text>
            )}
          </Pressable>
          {driveError ? <Text style={styles.error}>{t(driveError)}</Text> : null}

          <Text style={styles.label}>{t("add.label.color")}</Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder={t("add.placeholder.color")}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.color ? (
            <Text style={styles.error}>{t(errors.color.message ?? "")}</Text>
          ) : null}

          <TagSelector
            ownerId={user?.id ?? null}
            selectedTags={tags}
            onChange={setTags}
          />

          <Pressable
            disabled={Boolean(isBusy)}
            onPress={handleSubmit(onSubmit)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isBusy && styles.buttonDisabled,
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>{t("add.save_button")}</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => goBackOrReplace(router, WARDROBE_LIST_ROUTE)}>
          <Text style={styles.link}>{t("add.cancel")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => {
  const colors = theme.colors;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: spacing.lg,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
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
  navTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  photoUpload: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  uploadLabel: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  uploadHint: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
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
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    ...typography.body,
  },
  driveGrid: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: colors.surface3,
    marginTop: spacing.xs,
  },
  driveItem: {
    width: "48%",
  },
  driveImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.surface3,
  },
  drivePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driveLabel: {
    marginTop: spacing.xs,
    color: colors.muted,
    ...typography.caption,
  },
  error: {
    color: colors.danger,
    ...typography.caption,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.logoTint,
    ...typography.h2,
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    ...typography.body,
  },
  });
};
