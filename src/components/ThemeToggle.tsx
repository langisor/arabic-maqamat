import React from "react"
import { useTheme } from "./theme-provider"
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


interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

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
    </div>
  )
}
