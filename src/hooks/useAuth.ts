import { RootState } from "@/store";
import { useSelector } from "react-redux";

export const useAuth = () => {
  const { user, refreshToken, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  return { user, refreshToken, accessToken };
};
