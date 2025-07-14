'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { findSimilarStrings, normalizeRetailerName } from '@/lib/utils/fuzzy-match'

interface RetailerComboboxProps {
  retailers: string[]
  value?: string
  onValueChange: (value: string) => void
  className?: string
}

export function RetailerCombobox({
  retailers,
  value,
  onValueChange,
  className,
}: RetailerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  // Filter retailers based on input
  const filteredRetailers = React.useMemo(() => {
    if (!inputValue.trim()) return retailers
    
    const searchTerm = inputValue.toLowerCase()
    return retailers.filter(retailer => 
      retailer.toLowerCase().includes(searchTerm)
    )
  }, [retailers, inputValue])

  // Find similar retailers using fuzzy matching
  const similarRetailers = React.useMemo(() => {
    if (!inputValue.trim() || filteredRetailers.length > 0) return []
    
    return findSimilarStrings(inputValue, retailers, 0.6)
      .slice(0, 3) // Show top 3 similar matches
      .map(result => result.value)
  }, [inputValue, retailers, filteredRetailers])

  // Check if the input is a new retailer
  const isNewRetailer = inputValue.trim() && 
    !retailers.some(r => 
      normalizeRetailerName(r) === normalizeRetailerName(inputValue)
    )

  const handleSelect = (retailer: string) => {
    onValueChange(retailer)
    setOpen(false)
    setInputValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          {value ? (
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              {value}
            </span>
          ) : (
            <span className="text-muted-foreground">Select retailer</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search or add new retailer..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty className="p-2">
            {isNewRetailer && (
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => handleSelect(inputValue.trim())}
              >
                <Store className="h-4 w-4" />
                <span>Add &quot;{inputValue.trim()}&quot; as new retailer</span>
              </div>
            )}
          </CommandEmpty>
          
          {/* Exact matches */}
          {filteredRetailers.length > 0 && (
            <CommandGroup heading="Retailers">
              {filteredRetailers.map((retailer) => (
                <CommandItem
                  key={retailer}
                  value={retailer}
                  onSelect={() => handleSelect(retailer)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === retailer ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {retailer}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {/* Similar matches */}
          {similarRetailers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Did you mean...">
                {similarRetailers.map((retailer) => (
                  <CommandItem
                    key={`similar-${retailer}`}
                    value={retailer}
                    onSelect={() => handleSelect(retailer)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === retailer ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {retailer}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          
          {/* Add new option */}
          {isNewRetailer && filteredRetailers.length === 0 && similarRetailers.length === 0 && (
            <CommandGroup>
              <CommandItem
                value={inputValue}
                onSelect={() => handleSelect(inputValue.trim())}
              >
                <Store className="mr-2 h-4 w-4" />
                Add &quot;{inputValue.trim()}&quot; as new retailer
              </CommandItem>
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}