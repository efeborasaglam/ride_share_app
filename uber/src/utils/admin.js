import { fetchAuthSession } from "aws-amplify/auth";

export async function checkIsAdmin() {
  try {
    const { tokens } = await fetchAuthSession();
    const fromId = tokens?.idToken?.payload?.["cognito:groups"] ?? [];
    const fromAccess = tokens?.accessToken?.payload?.["cognito:groups"] ?? [];
    return [...fromId, ...fromAccess].includes("admin");
  } catch {
    return false;
  }
}
