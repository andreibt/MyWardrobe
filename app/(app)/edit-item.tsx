import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TagSelector } from "../../src/components/TagSelector";
import { useI18n } from "../../src/i18n/I18nProvider";
import { updateWardrobeItem } from "../../src/lib/firestore/wardrobeItems";
import {
  dismissToOrReplace,
  goBackOrReplace,
  WARDROBE_LIST_ROUTE,
} from "../../src/lib/navigation";
import { useAuth } from "../../src/providers/AuthProvider";
import { useTheme, type AppTheme } from "../../src/providers/ThemeProvider";
import { radius, spacing, typography } from "../../src/theme/tokens";

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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
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
    dismissToOrReplace(router, WARDROBE_LIST_ROUTE);
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
          >
            <MaterialCommunityIcons name="arrow-left" color={colors.text} size={20} />
          </Pressable>
          <View style={styles.navTitleGroup}>
            <Text style={styles.title}>{t("edit.title")}</Text>
            <Text style={styles.subtitle}>{t("edit.subtitle")}</Text>
          </View>
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

        <Pressable onPress={() => goBackOrReplace(router, WARDROBE_LIST_ROUTE)}>
          <Text style={styles.link}>{t("edit.cancel")}</Text>
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
  navTitleGroup: {
    flex: 1,
    gap: 2,
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
  title: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.muted,
    ...typography.caption,
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
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
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
