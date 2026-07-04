import { Stack } from "expo-router";

import { stableStackScreenOptions } from "../../src/lib/navigationOptions";

export default function AuthLayout() {
  return <Stack screenOptions={{ ...stableStackScreenOptions, headerShown: false }} />;
}
