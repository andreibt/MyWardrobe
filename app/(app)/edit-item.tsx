import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { TagSelector } from "../../src/components/TagSelector";
import { useI18n } from "../../src/i18n/I18nProvider";
import { updateWardrobeItem } from "../../src/lib/firestore/wardrobeItems";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

// const itemSchema = z.object({
//   title: z.string().min(2, "validation.title_required"),
//   description: z.string().min(4, "validation.description_required"),
//   imageUrl: z.string().url("validation.image_url_invalid"),
//   color: z.string().min(2, "validation.color_required"),
// });

const itemSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(4, "Description is required"),
  imageUrl: z.string().url("Enter a valid image URL"),
  color: z.string().min(2, "Color is required"),
});

type ItemForm = z.infer<typeof itemSchema>;

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";

const parseTags = (value: string | string[] | undefined) => {
  const raw = getParam(value);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
};

export default function EditItemScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    description?: string | string[];
    imageUrl?: string | string[];
    color?: string | string[];
    tags?: string | string[];
  }>();

  const itemId = getParam(params.id);
  const initialImageUrl = useMemo(() => getParam(params.imageUrl), [params.imageUrl]);
  const initialTags = useMemo(() => parseTags(params.tags), [params.tags]);
  const [tags, setTags] = useState<string[]>(initialTags);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: getParam(params.title),
      description: getParam(params.description),
      imageUrl: initialImageUrl,
      color: getParam(params.color),
    },
  });

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const onSubmit = async (data: ItemForm) => {
    if (!itemId) {
      return;
    }

    const payload = {
      ...data,
      tags,
      ...(data.imageUrl !== initialImageUrl ? { imageSerialized: "" } : {}),
    };
    await updateWardrobeItem(itemId, payload);
    router.replace("/(app)/(tabs)/wardrobe-list");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{t("edit.title")}</Text>
          <Text style={styles.subtitle}>{t("edit.subtitle")}</Text>
        </View>

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
            <Text style={styles.error}>{t(errors.title.message || "")}</Text>
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
            <Text style={styles.error}>{t(errors.description.message  || "")}</Text>
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
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
          {errors.imageUrl ? (
            <Text style={styles.error}>{t(errors.imageUrl.message  || "")}</Text>
          ) : null}

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
            <Text style={styles.error}>{t(errors.color.message  || "")}</Text>
          ) : null}

          <TagSelector
            ownerId={user?.id ?? null}
            selectedTags={tags}
            onChange={setTags}
          />

          <Pressable
            disabled={!!isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>{t("edit.save_button")}</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>{t("edit.cancel")}</Text>
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
    // ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    // ...typography.body,
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
    // ...typography.caption,
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
  error: {
    color: "#B00020",
    // ...typography.caption,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    // ...typography.h2,
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    // ...typography.body,
  },
});
