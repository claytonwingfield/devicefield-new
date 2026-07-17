interface LoadingAnimationProps {
  className?: string;
  fallback?: React.ReactNode;
}

export default function LoadingAnimation({
  className = "h-12 w-12",
  fallback,
}: LoadingAnimationProps) {
  if (fallback) return <>{fallback}</>;

  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden
    />
  );
}
