import { useRef, useState } from "react";
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

import { useI18n } from "../../../src/i18n/I18nProvider";
import { sendAssistantPrompt } from "../../../src/lib/assistant";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export default function AssistantScreen() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = async () => {
    const trimmedPrompt = prompt.trim();
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t("assistant.title")}</Text>
            <Text style={styles.subtitle}>{t("assistant.subtitle")}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("assistant.empty")}</Text>
            <Text style={styles.emptySubtitle}>{t("assistant.empty_subtitle")}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.messageAuthor, isUser && styles.userMessageAuthor]}>
                {isUser ? t("assistant.you") : t("assistant.agent")}
              </Text>
              <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
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
          onPress={handleSend}
          disabled={isSending || !prompt.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            (isSending || !prompt.trim()) && styles.sendButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {isSending ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.sendButtonText}>{t("assistant.send")}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messages: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body,
  },
  emptyState: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    ...typography.h2,
  },
  emptySubtitle: {
    color: colors.muted,
    ...typography.body,
  },
  messageBubble: {
    maxWidth: "88%",
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageAuthor: {
    color: colors.muted,
    ...typography.caption,
    textTransform: "uppercase",
  },
  userMessageAuthor: {
    color: colors.background,
  },
  messageText: {
    color: colors.text,
    ...typography.body,
  },
  userMessageText: {
    color: colors.background,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 130,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    ...typography.body,
  },
  sendButton: {
    minHeight: 48,
    minWidth: 82,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  sendButtonText: {
    color: colors.background,
    ...typography.body,
  },
});
