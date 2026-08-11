import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { Button } from "../../ui/components/Button";
import { Input } from "../../ui/components/Input";
import { useAuth } from "../../app/auth/useAuth";

function resolveReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/view";
  }

  if (value.startsWith("/login")) {
    return "/view";
  }

  return value;
}

export function LoginPage() {
  const { canEdit, clearError, errorMessage, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = resolveReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("danerogerjenkins@gmail.com");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const signedIn = await signIn(email, password);
      if (signedIn) {
        navigate(returnTo, { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (canEdit) {
    return <Navigate replace to={returnTo} />;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-10">
      <section className="ds-panel-surface w-full bg-cream/95 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/15 text-sage-dark">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">Editor Sign In</h1>
            <p className="mt-1 text-sm text-stone-600">Sign in to add or change books.</p>
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <Input
            id="login-email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => {
              clearError();
              setEmail(event.target.value);
            }}
            autoComplete="email"
          />

          <Input
            id="login-password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => {
              clearError();
              setPassword(event.target.value);
            }}
            autoComplete="current-password"
          />

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <Button type="submit" variant="primary" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </section>
    </div>
  );
}
