export type AuthUser = {
  id: string;
  email: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function signInWithEmail(email: string, _password: string): Promise<AuthUser> {
  await delay(400);

  return {
    id: "demo-user",
    email,
  };
}

export async function signOut(): Promise<void> {
  await delay(200);
}
