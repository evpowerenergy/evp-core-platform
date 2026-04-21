import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { THAILAND_PROVINCES, ThailandProvince, searchProvinces } from "@/utils/thailandProvinces";
import { useState, useEffect } from "react";

interface ProvinceSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProvinceSelect({
  value,
  onValueChange,
  placeholder = "เลือกจังหวัด",
  disabled = false,
  className,
}: ProvinceSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProvinces, setFilteredProvinces] = useState<ThailandProvince[]>(THAILAND_PROVINCES);

  // ค้นหาจังหวัดเมื่อมีการพิมพ์
  useEffect(() => {
    const results = searchProvinces(searchQuery);
    setFilteredProvinces(results);
  }, [searchQuery]);

  // หาจังหวัดที่เลือก
  const selectedProvince = value ? THAILAND_PROVINCES.find(p => p.name === value) : undefined;

  // จัดกลุ่มจังหวัดตามภูมิภาค
  const groupedProvinces = filteredProvinces.reduce((acc, province) => {
    if (!acc[province.region]) {
      acc[province.region] = [];
    }
    acc[province.region].push(province);
    return acc;
  }, {} as Record<string, ThailandProvince[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3",
            className
          )}
          disabled={disabled}
        >
          {selectedProvince ? (
            <span className="truncate">{selectedProvince.name}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="ค้นหาจังหวัด..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0 px-0"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>ไม่พบจังหวัดที่ค้นหา</CommandEmpty>
            {Object.entries(groupedProvinces).map(([region, provinces]) => (
              <CommandGroup key={region} heading={region}>
                {provinces.map((province) => (
                  <CommandItem
                    key={province.id}
                    value={province.name}
                    onSelect={() => {
                      onValueChange(province.name);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === province.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{province.name}</span>
                      <span className="text-xs text-gray-500">{province.nameEn}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
