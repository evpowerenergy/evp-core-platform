/**
 * Reusable Team Filter Select Component with grouped members
 * Separates current/active members from archived/old members
 * Archived members are collapsible (collapsed by default)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Users, ChevronDown, ChevronRight } from "lucide-react";
import { SalesTeamWithUserInfo } from "@/types/salesTeam";
import { groupSalesTeamByStatus } from "@/utils/salesTeamFilter";

interface TeamFilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  salesTeam: SalesTeamWithUserInfo[];
  placeholder?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  triggerClassName?: string;
}

export const TeamFilterSelect: React.FC<TeamFilterSelectProps> = ({
  value,
  onValueChange,
  salesTeam,
  placeholder = "เลือกเซลทีม",
  showAllOption = true,
  allOptionLabel = "ทั้งหมด",
  className,
  triggerClassName
}) => {
  const { currentMembers, archivedMembers } = groupSalesTeamByStatus(salesTeam);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const archivedSectionRef = useRef<HTMLDivElement>(null);
  const archivedContentRef = useRef<HTMLDivElement>(null);

  // Scroll to archived section when it opens
  useEffect(() => {
    if (isArchivedOpen && archivedSectionRef.current) {
      // Use setTimeout to ensure the content is rendered before scrolling
      setTimeout(() => {
        // Find the scrollable viewport container
        // Radix Select uses a viewport div, try multiple selectors
        let selectViewport: HTMLElement | null = null;
        
        // Try to find the viewport by traversing up the DOM
        let parent = archivedSectionRef.current?.parentElement;
        while (parent) {
          const style = window.getComputedStyle(parent);
          if (parent.scrollHeight > parent.clientHeight && 
              (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll')) {
            selectViewport = parent;
            break;
          }
          parent = parent.parentElement;
        }
        
        if (selectViewport && archivedSectionRef.current) {
          const viewportRect = selectViewport.getBoundingClientRect();
          const sectionRect = archivedSectionRef.current.getBoundingClientRect();
          
          // Check if the section is not fully visible in the viewport
          const isSectionVisible = 
            sectionRect.top >= viewportRect.top && 
            sectionRect.bottom <= viewportRect.bottom;
          
          if (!isSectionVisible) {
            // Calculate scroll position to show the section
            const sectionOffset = archivedSectionRef.current.offsetTop;
            const viewportHeight = selectViewport.clientHeight;
            const sectionHeight = archivedSectionRef.current.offsetHeight;
            
            // Try to center the section, but ensure it's visible
            const desiredScroll = sectionOffset - (viewportHeight / 2) + (sectionHeight / 2);
            
            selectViewport.scrollTo({
              top: Math.max(0, Math.min(desiredScroll, selectViewport.scrollHeight - viewportHeight)),
              behavior: 'smooth'
            });
          }
        } else if (archivedSectionRef.current) {
          // Fallback: use scrollIntoView if viewport not found
          archivedSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 200); // Delay to ensure content is fully rendered and animated
    }
  }, [isArchivedOpen]);

  return (
    <div className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName || "h-9 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="pb-3">
            {showAllOption && (
              <SelectItem value="all" className="font-medium">
                <div className="flex items-center space-x-2">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  <span>{allOptionLabel}</span>
                </div>
              </SelectItem>
            )}
            
            {/* Current/Active Members */}
            {currentMembers.length > 0 && (
              <>
                {showAllOption && <SelectSeparator className="my-1" />}
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 font-medium px-2 py-1">
                    สมาชิกปัจจุบัน
                  </SelectLabel>
                  {currentMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}

            {/* Archived/Old Members - Collapsible */}
            {archivedMembers.length > 0 && (
              <>
                <SelectSeparator className="my-1" />
                <div 
                  ref={archivedSectionRef}
                  className="px-2 py-1.5"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between text-xs text-gray-500 font-medium hover:bg-accent rounded-sm transition-colors cursor-pointer py-1 px-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsArchivedOpen(!isArchivedOpen);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <span>สมาชิกเก่า</span>
                    {isArchivedOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400 transition-transform" />
                    )}
                  </div>
                  {isArchivedOpen && (
                    <div ref={archivedContentRef} className="pt-1">
                      {archivedMembers.map((member) => (
                        <SelectItem 
                          key={member.id} 
                          value={member.id.toString()}
                          className="pl-8"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-600">{member.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

