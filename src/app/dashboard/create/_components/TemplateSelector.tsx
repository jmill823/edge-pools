"use client";

interface Template {
  templateName: string;
  categories: {
    name: string;
    sortOrder: number;
    golferNames: string[];
  }[];
}

interface TemplateSelectorProps {
  templates: Template[];
  selected: string;
  onSelect: (templateName: string) => void;
}

export function TemplateSelector({ templates, selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      {templates.map((t) => (
        <button
          key={t.templateName}
          onClick={() => onSelect(t.templateName)}
          className={`w-full rounded-lg border p-4 text-left transition min-h-[44px] ${
            selected === t.templateName
              ? "border-green-600 bg-green-50 ring-1 ring-green-600"
              : "border-green-200 hover:border-green-400"
          }`}
        >
          <div className="font-medium text-green-900">{t.templateName}</div>
          <div className="mt-1 text-xs text-green-600">
            {t.categories.length} categories:{" "}
            {t.categories.map((c) => c.name).join(", ")}
          </div>
        </button>
      ))}
    </div>
  );
}
