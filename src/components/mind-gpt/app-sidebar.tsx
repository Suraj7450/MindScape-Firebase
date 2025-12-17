'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, MoreHorizontal, Trash2, LayoutDashboard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirebase } from '@/firebase';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming this exists

// Mock history for now, will replace with real props later
const mockHistory = [
    { id: '1', title: 'Brainstorming Project Alpha', date: 'Today' },
    { id: '2', title: 'React Component Structure', date: 'Yesterday' },
    { id: '3', title: 'Marketing Strategy Q4', date: 'Previous 7 Days' },
];

interface AppSidebarProps {
    onNewChat?: () => void;
    history?: any[]; // Replace with proper type
    onSelectChat?: (id: string) => void;
}

export function AppSidebar({ onNewChat, history = [], onSelectChat }: AppSidebarProps) {
    const { user } = useFirebase();

    return (
        <Sidebar collapsible="offcanvas">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between px-2 py-2">
                            <span className="font-bold text-xl tracking-tight">MindGPT</span>
                            <SidebarTrigger className="-mr-2" />
                        </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 shadow-sm"
                            onClick={onNewChat}
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Chat</span>
                        </Button>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <ScrollArea className="h-full px-2">
                    <div className="py-2">
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Recent</h3>
                        <SidebarMenu>
                            {history.length > 0 ? (
                                history.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton asChild onClick={() => onSelectChat?.(item.id)}>
                                            <button className="w-full justify-start truncate">
                                                <span>{item.title || 'Untitled Chat'}</span>
                                            </button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            ) : (
                                <div className="px-2 text-sm text-muted-foreground">No recent history</div>
                            )}
                        </SidebarMenu>
                    </div>
                </ScrollArea>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                        <AvatarFallback className="rounded-lg">
                                            {user?.displayName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.displayName || 'User'}</span>
                                        <span className="truncate text-xs">{user?.email}</span>
                                    </div>
                                    <MoreHorizontal className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
