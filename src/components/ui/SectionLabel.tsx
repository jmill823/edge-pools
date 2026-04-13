interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <p className={`font-sans text-[10px] font-medium uppercase text-[#6B6560] tracking-[0.5px] ${className}`}>
      {children}
    </p>
  );
}
