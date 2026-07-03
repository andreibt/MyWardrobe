import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../src/i18n/I18nProvider";
import { sendAssistantPrompt } from "../../../src/lib/assistant";
import { useTheme, type AppTheme } from "../../../src/providers/ThemeProvider";
import { spacing, typography } from "../../../src/theme/tokens";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const SUGGESTION_KEYS = [
  "assistant.suggestion_wardrobe",
  "assistant.suggestion_recipes",
  "assistant.suggestion_receipt",
];

export default function AssistantScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme.colors;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = async (nextPrompt = prompt) => {
    const trimmedPrompt = nextPrompt.trim();
    if (!trimmedPrompt || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmedPrompt,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setPrompt("");
    setIsSending(true);

    try {
      const answer = await sendAssistantPrompt(trimmedPrompt);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: answer,
        },
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          text: t("assistant.error"),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser ? (
          <View style={styles.messageHeader}>
            <View style={styles.messageAvatar}>
              <MaterialCommunityIcons name="robot-outline" color={colors.primary} size={14} />
            </View>
            <Text style={styles.messageAuthor}>{t("assistant.agent")}</Text>
          </View>
        ) : null}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
          {t("assistant.just_now")}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.messages,
          {
            paddingTop: Math.max(insets.top + spacing.sm, spacing.lg),
            paddingBottom: spacing.lg,
          },
        ]}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{t("assistant.title")}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{t("assistant.online")}</Text>
              </View>
            </View>
            <View style={styles.headerButton}>
              <MaterialCommunityIcons name="auto-fix" color={colors.textMuted} size={20} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="robot-happy-outline" color={colors.primary} size={30} />
            </View>
            <Text style={styles.emptyTitle}>{t("assistant.empty")}</Text>
            <Text style={styles.emptySubtitle}>{t("assistant.empty_subtitle")}</Text>
          </View>
        }
        ListFooterComponent={
          isSending ? (
            <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotMuted]} />
              <View style={[styles.typingDot, styles.typingDotSoft]} />
            </View>
          ) : null
        }
      />

      <View style={styles.suggestions}>
        {SUGGESTION_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => handleSend(t(key))}
            disabled={isSending}
            style={({ pressed }) => [
              styles.suggestionChip,
              pressed && styles.buttonPressed,
              isSending && styles.disabled,
            ]}
          >
            <Text style={styles.suggestionText}>{t(key)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom + 8, spacing.sm) }]}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={t("assistant.placeholder")}
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
          editable={!isSending}
        />
        <Pressable
          onPress={() => handleSend()}
          disabled={isSending || !prompt.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            (isSending || !prompt.trim()) && styles.sendButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("assistant.send")}
        >
          {isSending ? (
            <ActivityIndicator color={colors.logoTint} size="small" />
          ) : (
            <MaterialCommunityIcons name="arrow-up" color={colors.logoTint} size={22} />
          )}
        </Pressable>
      </View>
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
    messages: {
      flexGrow: 1,
      paddingHorizontal: 20,
      gap: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    titleBlock: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "700",
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    statusText: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "600",
    },
    headerButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    emptyState: {
      alignItems: "center",
      alignSelf: "center",
      width: "100%",
      maxWidth: 340,
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      gap: spacing.xs,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: colors.surface3,
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      color: colors.text,
      ...typography.h2,
      textAlign: "center",
    },
    emptySubtitle: {
      color: colors.textMuted,
      ...typography.body,
      textAlign: "center",
    },
    messageBubble: {
      maxWidth: "82%",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      gap: 6,
    },
    userBubble: {
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
      backgroundColor: colors.primary,
    },
    assistantBubble: {
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    messageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    messageAvatar: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      backgroundColor: colors.surface3,
    },
    messageAuthor: {
      color: colors.textMuted,
      ...typography.caption,
      textTransform: "uppercase",
      fontWeight: "700",
    },
    messageText: {
      color: colors.text,
      ...typography.body,
      lineHeight: 23,
    },
    userMessageText: {
      color: colors.logoTint,
    },
    messageTime: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "600",
    },
    userMessageTime: {
      color: theme.isDark ? "rgba(8, 9, 14, 0.55)" : "rgba(245, 247, 250, 0.75)",
    },
    typingBubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: spacing.md,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textMuted,
    },
    typingDotMuted: {
      opacity: 0.65,
    },
    typingDotSoft: {
      opacity: 0.35,
    },
    suggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      paddingHorizontal: 20,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      backgroundColor: colors.background,
    },
    suggestionChip: {
      minHeight: 34,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    suggestionText: {
      color: colors.textMuted,
      ...typography.caption,
      fontWeight: "700",
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      paddingTop: spacing.sm,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: theme.isDark ? "rgba(17, 19, 24, 0.96)" : colors.surface2,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 130,
      paddingVertical: 11,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      color: colors.text,
      ...typography.body,
    },
    sendButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: colors.primary,
    },
    sendButtonDisabled: {
      opacity: 0.3,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.45,
    },
  });
};
