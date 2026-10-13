import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { generateClient } from "aws-amplify/api";
import { getMyProfile, saveProfile } from "../graphql/operations";

const client = generateClient();
const ProfileContext = createContext(null);

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setupRole, setSetupRole] = useState(null); // null = no setup screen

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.graphql({ query: getMyProfile });
      setProfile(res.data.getMyProfile);
    } catch (e) {
      console.log("PROFILE ERROR:", e.errors ?? e);
      setError("Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (input) => {
    const res = await client.graphql({
      query: saveProfile,
      variables: { input },
    });
    setProfile(res.data.saveProfile);
    return res.data.saveProfile;
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        reload: load,
        save,
        setupRole,
        openSetup: (role) => setSetupRole(role),
        closeSetup: () => setSetupRole(null),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
