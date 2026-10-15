import React from "react"
import { useTheme } from "./theme-provider"
<<<<<<< HEAD
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { useLanguage } from "../state/language"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
=======
import { Sun, Moon, Monitor } from "lucide-react"
import { useLanguage } from "../state/language"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

>>>>>>> lovely-ball

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
<<<<<<< HEAD

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger className="relative flex cursor-pointer items-center justify-center rounded-lg p-2 text-slate-100 transition hover:bg-slate-800 focus:outline-none">
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
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
=======

  const getThemeIcon = (value: string) => {
    if (value === "light") return <Sun className="h-4 w-4" />
    if (value === "dark") return <Moon className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="h-7 w-auto gap-1.5 px-1.5 sm:h-8 sm:px-2">
          {getThemeIcon(theme)}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="light" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              {t("themeLight")}
            </SelectItem>
            <SelectItem value="dark" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              {t("themeDark")}
            </SelectItem>
            <SelectItem value="system" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {t("themeAuto")}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
>>>>>>> lovely-ball
    </div>
  )
}
