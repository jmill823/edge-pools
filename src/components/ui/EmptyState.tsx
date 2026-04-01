import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-4 text-green-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-green-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-green-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
