type GoogleLogoProps = {
  className?: string;
};

export function GoogleLogo({ className }: GoogleLogoProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.31h6.44a5.51 5.51 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.08.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.25v3.12A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.28A7.16 7.16 0 0 1 4.87 12c0-.79.14-1.56.38-2.28V6.6H1.25A12 12 0 0 0 0 12c0 1.93.46 3.76 1.25 5.4l4-3.12Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.36.62 4.62 1.82l3.44-3.46A11.93 11.93 0 0 0 12 0 12 12 0 0 0 1.25 6.6l4 3.12c.95-2.84 3.61-4.95 6.75-4.95Z"
      />
    </svg>
  );
}
