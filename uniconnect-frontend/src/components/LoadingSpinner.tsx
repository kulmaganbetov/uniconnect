interface LoadingSpinnerProps {
  fullPage?: boolean;
  label?: string;
}

export default function LoadingSpinner({
  fullPage = false,
  label,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      {label && <p className="text-sm text-muted font-medium">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="py-10 flex justify-center">{spinner}</div>;
}
