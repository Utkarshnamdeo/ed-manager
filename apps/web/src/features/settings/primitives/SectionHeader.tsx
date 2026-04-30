interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-foreground tracking-tight">
        {title}
      </h2>
      {action && <div>{action}</div>}
    </div>
  )
}
