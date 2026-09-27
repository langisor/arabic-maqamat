import type { ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"

interface Props {
  kind: "loading" | "error" | "status"
  title: string
  description?: ReactNode
  action?: { label: string; onClick: () => void; disabled?: boolean }
  className?: string
}

export function AsyncFeedback({ kind, title, description, action, className }: Props) {
  if (kind === "loading") {
    return (
      <div className={className} role="status" aria-live="polite" aria-busy="true">
        <Spinner aria-hidden="true" />
        <span>{title}</span>
      </div>
    )
  }

  if (kind === "error") {
    return (
      <Alert variant="destructive" className={className} aria-live="assertive">
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
        {action && <Button size="sm" variant="outline" onClick={action.onClick} disabled={action.disabled}>{action.label}</Button>}
      </Alert>
    )
  }

  return (
    <div className={className} role="status" aria-live="polite">
      <span>{title}</span>
      {description}
    </div>
  )
}