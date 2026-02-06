import type { FC } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../auth/AuthProvider";
import Logo from "../components/shared/Logo";

const LoginPage: FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />

      {/* Ambient glows */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl animate-pulse dark:bg-amber-500/15" />
      <div className="absolute top-32 -right-24 h-80 w-80 rounded-full bg-yellow-200/35 blur-3xl animate-pulse dark:bg-yellow-500/15" />
      <div className="absolute -bottom-28 left-1/3 h-96 w-96 rounded-full bg-orange-200/35 blur-3xl animate-pulse dark:bg-orange-500/15" />

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div
            className={`
              relative overflow-hidden rounded-3xl
              border border-white/70 bg-white/70 backdrop-blur-xl
              shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]
              dark:border-white/10 dark:bg-white/5
            `}
          >
            {/* subtle top shine */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-white/10" />

            <div className="relative p-8 sm:p-10">
              <div className="mb-7 flex items-center gap-4">
                <div
                  className={`
                    rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 p-3
                    dark:from-amber-500/15 dark:to-yellow-500/5
                  `}
                >
                  <Logo />
                </div>

                <div className="self-center ml-6 text-center">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Sign in
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Access the admin dashboard
                  </p>
                </div>
              </div>

              <LoginForm />

              <p className="mt-6 text-[10px] text-center text-gray-500 dark:text-gray-400">
                By signing in you agree to the Terms of Service.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-amber-200/60 to-transparent dark:via-amber-500/30" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
