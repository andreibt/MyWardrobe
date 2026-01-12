import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      color: "",
    },
  });

  const onSubmit = async (data: ItemForm) => {
    if (!user) {
      return;
    }

    await addWardrobeItem(user.id, data);
    router.replace("/(app)/(tabs)/home");
  };
  const isBusy = Boolean(isSubmitting);

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
