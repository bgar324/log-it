"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  name: string;
  autoComplete: string;
  minLength?: number;
};

export function PasswordField({
  id,
  label,
  name,
  autoComplete,
  minLength,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const actionLabel = isVisible ? "Hide" : "Show";

  return (
    <label className="field" htmlFor={id}>
      <span className="label">{label}</span>
      <div className="password-input-wrap">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          className="input password-input"
          minLength={minLength}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={`${actionLabel} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <EyeOff className="password-toggle-icon" aria-hidden="true" strokeWidth={1.9} />
          ) : (
            <Eye className="password-toggle-icon" aria-hidden="true" strokeWidth={1.9} />
          )}
        </button>
      </div>
    </label>
  );
}
