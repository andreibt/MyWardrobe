import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Platform,
  View,
  useWindowDimensions,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../src/i18n/I18nProvider";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const SLIDE_KEYS = ["tutorial.slide1", "tutorial.slide2", "tutorial.slide3"] as const;

export default function TutorialScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndex = SLIDE_KEYS.length - 1;

  const handleSkip = () => {
    router.replace("/(app)/(tabs)/home");
  };

  const handleNext = () => {
    console.log('the next handle?');
    console.log(currentIndex);


    if (currentIndex >= lastIndex) {
      handleSkip();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
    if (Platform.OS === "web") {
      setCurrentIndex(currentIndex + 1);
      return;
    }
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(nextIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={handleSkip} style={({ pressed }) => pressed && styles.buttonPressed}>
          <Text style={styles.skipText}>{t("tutorial.skip")}</Text>
        </Pressable>
      </View>

      <ImageBackground
              source={require("../../src/assets/images/wardrobeTutorial3.jpg")}
              style={styles.imgBackground}
              resizeMode="cover">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          style={styles.slider}
        >
          {SLIDE_KEYS.map((key) => (
            
              <View key={key} style={[styles.slide, { width }]}>
                  <View style={styles.slideCard}>
                    <Text style={styles.slideText}>{t(key)}</Text>
                  </View>
              </View>
          ))}
        </ScrollView>
      </ImageBackground>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDE_KEYS.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex === lastIndex ? t("tutorial.get_started") : t("tutorial.next")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imgBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "flex-end",
  },
  skipText: {
    color: colors.primary,
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  slider: {
    flex: 1,
  },
  slide: {
    justifyContent: "center",
    alignItems: "center",
    height: "80%",
    paddingHorizontal: spacing.lg,
  },
  slideCard: {
    width: "100%",
    height: "80%",
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  slideText: {
    color: colors.text,
    ...typography.body,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  primaryButton: {
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.surface,
    ...typography.h2,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
