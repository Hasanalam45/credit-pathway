import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import Button from "../shared/buttons/Button";

const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"superadmin" | "support">("superadmin");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.login(email.trim(), password, role);
      // Navigate based on selected role
      navigate(role === "support" ? "/support" : "/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      {/* EMAIL */}
      <div className="group">
        <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="
            mt-1 block w-full rounded-xl border border-gray-200 bg-white/90
            px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400
            shadow-sm transition
            focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-200/50
            group-hover:border-gray-300
            dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100 dark:placeholder:text-gray-500
            dark:focus:border-amber-350 dark:focus:ring-amber-400/20
          "
        />
      </div>

      {/* PASSWORD */}
      <div className="group">
        <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300">
          Password
        </label>

        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="
              block w-full rounded-xl border border-gray-200 bg-white/90
              px-3.5 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400
              shadow-sm transition
              focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-200/50
              group-hover:border-gray-300
              dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100 dark:placeholder:text-gray-500
              dark:focus:border-amber-350 dark:focus:ring-amber-400/20
            "
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              rounded-lg px-2 py-1 text-[11px] font-medium
              text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition
              dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/10
            "
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>
      </div>

      {/* ROLE */}
      <div className="group">
        <label className="block text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300">
          Role
        </label>
        <div className="mt-1 relative">
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "superadmin" | "support")
            }
            className="
              block w-full appearance-none rounded-xl border border-gray-200
              bg-white/90 px-3.5 py-2.5 text-sm text-gray-800 shadow-sm transition
              focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-200/50
              group-hover:border-gray-300
              dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100
              dark:focus:border-amber-350 dark:focus:ring-amber-400/20
            "
          >
            <option value="superadmin">Super Admin</option>
            <option value="support">Support Team</option>
          </select>

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            ▾
          </span>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* BUTTON WRAP */}
      <div className="pt-1">
        <div
          className="
            rounded-2xl p-[1px]
            bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200
            dark:from-amber-500/30 dark:via-yellow-500/20 dark:to-orange-500/30
          "
        >
          <div className="rounded-2xl bg-white/80 dark:bg-gray-900/30 p-1">
            <Button type="submit" disabled={submitting} fullWidth>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
