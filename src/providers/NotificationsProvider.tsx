import { useEffect } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { registerForPushNotificationsAsync } from "../lib/notifications";
import { savePushToken } from "../lib/firestore/pushTokens";
import { useAuth } from "./AuthProvider";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    let isActive = true;

    if (!user || Platform.OS === "web") {
      return () => {
        isActive = false;
      };
    }

    registerForPushNotificationsAsync()
      .then((result) => {
        if (!isActive || !result) {
          return;
        }

        const platform = Platform.OS === "android" ? "android" : "ios";
        return savePushToken(user.id, result.token, platform, result.type);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [user]);

  return <>{children}</>;
}
