import Link from "next/link";
import { redirect } from "next/navigation";
import type { HTMLInputTypeAttribute } from "react";
import { PasswordField } from "../components/password-field";
import { PublicFooter, PublicHeader } from "../components/public-site";
import { getSessionUser } from "@/lib/auth";
import styles from "./auth.module.css";
import landingStyles from "../landing.module.css";

type Mode = "signin" | "register";
type SearchParams = Promise<{ mode?: string; error?: string }>;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Please complete all required fields.",
  invalid_email: "Use a valid email address.",
  email_mismatch: "Email and confirm email do not match.",
  invalid_username:
    "Username must be 3-24 chars and only letters, numbers, or underscores.",
  weak_password: "Password must be at least 8 characters.",
  password_mismatch: "Password and confirm password do not match.",
  account_exists: "An account with that email or username already exists.",
  invalid_credentials: "Username or password is incorrect.",
  invalid_request: "Unable to validate that request.",
  service_unavailable: "Service is temporarily unavailable. Please try again.",
  server_error: "Something went wrong. Please try again.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const mode: Mode = params.mode === "signin" ? "signin" : "register";
  const errorMessage = params.error
    ? (AUTH_ERROR_MESSAGES[params.error] ?? "Unable to process that request.")
    : null;

  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/dashboard");
  }

  return (
    <div className={`${styles.page} ${landingStyles.publicRoot}`}>
      <PublicHeader />

      <main className={styles.main}>
        <div className={styles.column}>
          <h1 className={styles.title}>
            {mode === "register" ? "create account" : "sign in"}
          </h1>

          {errorMessage ? (
            <p className="auth-alert" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="auth-switch">
            <Link
              href="/auth?mode=signin"
              className="switch-option"
              data-active={mode === "signin"}
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=register"
              className="switch-option"
              data-active={mode === "register"}
            >
              Register
            </Link>
          </div>

          {mode === "register" ? <RegisterForm /> : <SignInForm />}

          <p className="tos">
            By continuing, you agree to our{" "}
            <Link href="/legal" className="legal-inline-link">
              Terms of Conditions
            </Link>
            .
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function RegisterForm() {
  return (
    <form className="form" method="post" action="/auth/register">
      <div className="form-grid form-grid-two">
        <Field
          id="firstName"
          label="First name"
          name="firstName"
          autoComplete="given-name"
        />
        <Field
          id="lastName"
          label="Last name"
          name="lastName"
          autoComplete="family-name"
        />
      </div>

      <Field
        id="username"
        label="Username"
        name="username"
        autoComplete="off"
      />
      <div className="form-grid form-grid-two">
        <Field
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <Field
          id="confirmEmail"
          label="Confirm email"
          name="confirmEmail"
          type="email"
          autoComplete="email"
        />
      </div>
      <div className="form-grid form-grid-two">
        <PasswordField
          id="password"
          label="Password"
          name="password"
          autoComplete="new-password"
          minLength={8}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Create account
      </button>
    </form>
  );
}

function SignInForm() {
  return (
    <form className="form" method="post" action="/auth/signin">
      <Field
        id="signinUsername"
        label="Username"
        name="signinUsername"
        autoComplete="username"
      />
      <PasswordField
        id="signinPassword"
        label="Password"
        name="signinPassword"
        autoComplete="current-password"
        minLength={8}
      />
      <button type="submit" className="btn btn-primary">
        Sign in
      </button>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  minLength?: number;
};

function Field({
  id,
  label,
  name,
  type = "text",
  autoComplete = "off",
  minLength,
}: FieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className="label">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        className="input"
        minLength={minLength}
        required
      />
    </label>
  );
}
