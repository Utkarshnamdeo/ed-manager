interface FormRowProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
  hint?: string
}

export function FormRow({ label, htmlFor, children, hint }: FormRowProps) {
  return (
    <div className="flex items-start gap-6 py-4 border-b border-border last:border-0">
      <div className="w-48 shrink-0 pt-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
