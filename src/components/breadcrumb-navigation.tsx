
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
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Home
        className="h-4 w-4 cursor-pointer hover:text-foreground"
        onClick={() => onSelect(0)}
      />
      {displayedItems.length > 2 && (
        <>
          <ChevronRight className="h-4 w-4" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-1">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {displayedItems
                .slice(0, -1)
                .map((map, index) => (
                  <DropdownMenuItem key={index} onSelect={() => onSelect(index)}>
                    {map.topic}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      {displayedItems.slice(Math.max(0, displayedItems.length - 2)).map((map, index) => {
        const actualIndex = Math.max(0, displayedItems.length - 2) + index;
        if (actualIndex === 0 && displayedItems.length > 1) return null; // Skip first item if more than one is shown
        if (actualIndex === 0 && displayedItems.length === 1) { // If it's the only item, render it
            return (
              <React.Fragment key={actualIndex}>
                <ChevronRight className="h-4 w-4" />
                <span
                  className={`font-medium ${
                    actualIndex === activeIndex
                      ? 'text-foreground'
                      : 'cursor-pointer hover:text-foreground'
                  }`}
                  onClick={() => onSelect(actualIndex)}
                >
                  {map.topic}
                </span>
              </React.Fragment>
            );
        }

        return (
          <React.Fragment key={actualIndex}>
            <ChevronRight className="h-4 w-4" />
            <span
              className={`font-medium ${
                actualIndex === activeIndex
                  ? 'text-foreground'
                  : 'cursor-pointer hover:text-foreground'
              }`}
              onClick={() => onSelect(actualIndex)}
            >
              {map.topic}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
