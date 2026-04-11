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
          className={`w-full rounded-card border p-4 text-left transition-colors duration-200 min-h-[44px] cursor-pointer ${
            selected === t.templateName
              ? "border-accent-primary bg-[#E8F3ED]"
              : "border-border hover:border-accent-primary/40"
          }`}
        >
          <div className="font-sans font-medium text-text-primary">{t.templateName}</div>
          <div className="mt-1 font-sans text-xs text-text-secondary">
            {t.categories.length} categories:{" "}
            {t.categories.map((c) => c.name).join(", ")}
          </div>
        </button>
      ))}
    </div>
  );
}
