"use client"

const locales = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "zh",
    label: "中文（简体）",
  },
  // {
  //   value: "ja",
  //   label: "日本語",
  // },
]

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from '@/i18n/routing'

export default function LocaleSwitch() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setValue(location.pathname.split("/")[1])
  }, [])

  console.log(pathname)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-fit justify-between"
        >
          {value
            ? locales.find((framework) => framework.value === value)?.label
            : "Languages"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {locales.map((locale) => (
                <CommandItem
                  key={locale.value}
                  value={locale.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    router.replace(`${pathname}`, {
                      locale: currentValue as any,
                    })
                    router.refresh()
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === locale.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {locale.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
