import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { type Href, type Router, useFocusEffect, useRouter } from "expo-router";

export const APP_HOME_ROUTE = "/(app)/(tabs)/home" as const;
export const WARDROBE_LIST_ROUTE = "/(app)/(wardrobe)/wardrobe-list" as const;
export const FRIDGE_LIST_ROUTE = "/(app)/(fridge)/fridge-list" as const;
export const FRIDGE_RECIPES_ROUTE = "/(app)/(fridge)/recipes" as const;
export const PANTRY_ROUTE = "/(app)/(pantry)/pantry" as const;
export const COCKTAILS_ROUTE = "/(app)/(cocktails)/cocktails" as const;
export const COCKTAIL_RECIPES_ROUTE = "/(app)/(cocktails)/cocktail-recipes" as const;
export const WARDROBE_CALENDAR_ROUTE = "/(app)/(wardrobe)/calendar" as const;

export function goBackOrReplace(router: Router, fallback: Href) {
  try {
    if (router.canGoBack()) {
      router.back();
      return;
    }
  } catch {
    router.replace(fallback);
    return;
  }

  router.replace(fallback);
}

export function dismissToOrReplace(router: Router, href: Href) {
  try {
    router.dismissTo(href);
  } catch {
    router.replace(href);
  }
}

export function useAndroidRootBackGuard() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        try {
          return !router.canGoBack();
        } catch {
          return true;
        }
      });
      return () => subscription.remove();
    }, [router])
  );
}
