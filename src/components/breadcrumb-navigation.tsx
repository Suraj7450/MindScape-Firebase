
'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import type { GenerateMindMapOutput } from '@/ai/flows/generate-mind-map';

interface BreadcrumbNavigationProps {
  maps: GenerateMindMapOutput[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function BreadcrumbNavigation({
  maps,
  activeIndex,
  onSelect,
}: BreadcrumbNavigationProps) {
  const displayedItems = maps.slice(0, activeIndex + 1);

  return (
    <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
      {/* ALWAYS show the Root (Home) */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${0 === activeIndex
            ? 'bg-purple-600 text-white font-medium shadow-[0_0_15px_rgba(147,51,234,0.5)]'
            : 'hover:bg-zinc-800/50 hover:text-purple-400 cursor-pointer'
          }`}
        onClick={() => onSelect(0)}
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">{maps[0]?.topic}</span>
      </div>

      {maps.map((map, index) => {
        if (index === 0) return null; // Already rendered Home
        if (index > activeIndex) return null; // Don't show future history if we went back

        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
            <div
              className={`px-3 py-1.5 rounded-full transition-all duration-300 ${index === activeIndex
                  ? 'bg-purple-600 text-white font-medium shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                  : 'hover:bg-zinc-800/50 hover:text-purple-400 cursor-pointer'
                }`}
              onClick={() => onSelect(index)}
            >
              {map.topic}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
