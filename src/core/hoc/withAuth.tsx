import { useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/hooks/useAuth";
import { AuthLoadingContext } from "@/app/Provider";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AuthComponent = (props: P) => {
    const { user } = useAuth();
    const router = useRouter();
    const isAuthReady = useContext(AuthLoadingContext);

    useEffect(() => {
      if (isAuthReady && !user) {
        router.push("/auth/login");
      }
    }, [user, router, isAuthReady]);

    if (!isAuthReady) return null;
    if (!user) return null;

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
