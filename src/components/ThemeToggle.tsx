import React from "react"
import { useTheme } from "./theme-provider"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { useLanguage } from "../state/language"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("toggleTheme")}
          title={t("toggleTheme")}
          className="relative flex cursor-pointer items-center justify-center rounded-lg p-2 text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Sun
            aria-hidden="true"
            className={`h-4 w-4 transition-all ${resolvedTheme === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`}
          />
          <Moon
            aria-hidden="true"
            className={`absolute h-4 w-4 transition-all ${resolvedTheme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`}
          />
          <span className="sr-only">{t("toggleTheme")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>{t("themeLight")}</span>
            </span>
            {theme === "light" && (
              <Check className="h-3.5 w-3.5 text-slate-400" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>{t("themeDark")}</span>
            </span>
            {theme === "dark" && (
              <Check className="h-3.5 w-3.5 text-slate-400" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>{t("themeAuto")}</span>
            </span>
            {theme === "system" && (
              <Check className="h-3.5 w-3.5 text-slate-400" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
