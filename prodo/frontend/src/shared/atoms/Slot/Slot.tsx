interface SlotProps {
  children: React.ReactNode
  className?: string // Exception to Rule 11 — boundary component
}

export function Slot({ children, className }: SlotProps) {
  return (
    <div className={`flex-1 min-w-0 overflow-hidden${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
