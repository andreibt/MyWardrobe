import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { PushTokenType } from "./firestore/pushTokens";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushTokenResult = {
  token: string;
  type: PushTokenType;
};

export async function registerForPushNotificationsAsync(): Promise<PushTokenResult | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  const token = typeof deviceToken.data === "string" ? deviceToken.data : "";

  if (!token) {
    return null;
  }

  return {
    token,
    type: Platform.OS === "android" ? "fcm" : "apns",
  };
}
