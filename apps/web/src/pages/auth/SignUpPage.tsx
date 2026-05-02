import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";

export function SignUpPage() {
  const { signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      navigate("/", { replace: true });
      return;
    }
    signUp();
  }, [signUp, user, isLoading, navigate]);

  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div className="text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-neutral-400 mb-2">
          Join US-RSE
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Redirecting you to create your account…
        </h1>
        <p className="text-neutral-600 mt-2 max-w-md">
          You'll be returned to US-RSE once your account is ready.
        </p>
      </div>
    </div>
  );
}
