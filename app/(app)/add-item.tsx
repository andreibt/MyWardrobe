import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
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

import { addWardrobeItem } from "../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const itemSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(4, "Description is required"),
  imageUrl: z.string().url("Enter a valid image URL"),
  color: z.string().min(2, "Color is required"),
});

type ItemForm = z.infer<typeof itemSchema>;

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
  const [driveFiles, setDriveFiles] = useState<
    Array<{ id: string; name: string; mimeType: string; thumbnailLink?: string}>
  >([]);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const isBusy = Boolean(isSubmitting);
  const driveApiKey = "AIzaSyBeO6ZDVcS5PRzXic4mfbCJkqPB1s0dBFc";

  const folderId = useMemo(() => {
    const match = driveFolderLink.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }, [driveFolderLink]);

  const onSubmit = async (data: ItemForm) => {
    if (!user) {
      return;
    }

    await addWardrobeItem(user.id, data);
    router.replace("/(app)/(tabs)/home");
  };

  const handleLoadDriveFiles = async () => {
    if (!folderId) {
      setDriveError("Paste a valid Google Drive folder link.");
      return;
    }

    setDriveError(null);
    setIsDriveLoading(true);
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
      const fields = encodeURIComponent(
        "files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink)"
      );
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${driveApiKey}`
      );

      if (!response.ok) {
        throw new Error("Drive request failed.");
      }

      const payload = await response.json();
      const files = Array.isArray(payload.files) ? payload.files : [];
      const imageFiles = files.filter((file: { mimeType?: string }) =>
        String(file.mimeType || "").startsWith("image/")
      );
      setDriveFiles(imageFiles);
      if (imageFiles.length === 0) {
        setDriveError("No images found in that folder.");
      }
    } catch {
      setDriveError("Could not load images from Drive.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSelectDriveFile = (thumbnailLink: string) => {
    // const imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const imageUrl = thumbnailLink;
    setValue("imageUrl", imageUrl, { shouldValidate: true });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Add a Wardrobe Item</Text>
          <Text style={styles.subtitle}>
            Save a quick reference for your next outfit decision.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="Cropped linen shirt"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.title ? <Text style={styles.error}>{errors.title.message}</Text> : null}

          <Text style={styles.label}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="Lightweight and perfect for layering."
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
            <Text style={styles.error}>{errors.description.message}</Text>
          ) : null}

          <Text style={styles.label}>Image URL</Text>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
          {errors.imageUrl ? (
            <Text style={styles.error}>{errors.imageUrl.message}</Text>
          ) : null}

          <View style={styles.divider} />
          <Text style={styles.label}>Or choose from Drive folder</Text>
          <TextInput
            placeholder="https://drive.google.com/drive/folders/..."
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
              isDriveLoading && styles.buttonDisabled,
            ]}
            disabled={isDriveLoading}
          >
            {isDriveLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Load Drive images</Text>
            )}
          </Pressable>
          {driveError ? <Text style={styles.error}>{driveError}</Text> : null}
          {driveFiles.length > 0 ? (
            <View style={styles.driveGrid}>
              {driveFiles.map((file) => (
                <Pressable
                  key={file.id}
                  onPress={() => handleSelectDriveFile(file.thumbnailLink || '')}
                  style={styles.driveItem}
                >
                  {file.thumbnailLink ? ( 
                    <Image source={{ uri: file.thumbnailLink }} style={styles.driveImage} />
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

          <Text style={styles.label}>Color</Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                placeholder="Ivory"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {errors.color ? <Text style={styles.error}>{errors.color.message}</Text> : null}

          <Pressable
            disabled={isBusy}
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
              <Text style={styles.buttonText}>Save item</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    backgroundColor: colors.card,
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
    backgroundColor: colors.surface,
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
  driveItem: {
    width: "48%",
  },
  driveImage: {
    width: "100%",
    height: 120,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  drivePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driveLabel: {
    marginTop: spacing.xs,
    color: colors.muted,
    ...typography.caption,
  },
  error: {
    color: "#B00020",
    ...typography.caption,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    ...typography.h2,
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    ...typography.body,
  },
});
