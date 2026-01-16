'use client';

import React from 'react';
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info,
    ChevronRight,
    Trash2,
    BellOff
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/contexts/notification-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const router = useRouter();

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'loading': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const handleNotificationClick = (n: Notification) => {
        markAsRead(n.id);
        if (n.link) {
            router.push(n.link);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-xl hover:bg-white/5 transition-colors"
                >
                    <Bell className={cn("h-5 w-5", unreadCount > 0 ? "text-primary animate-pulse" : "text-zinc-400")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 glassmorphism p-0 overflow-hidden" align="end" forceMount>
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <DropdownMenuLabel className="p-0 font-bold tracking-tight">Activities</DropdownMenuLabel>
                    <div className="flex gap-2">
                        {notifications.length > 0 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white"
                                    onClick={markAllAsRead}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-zinc-500 hover:text-red-400"
                                    onClick={clearNotifications}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <BellOff className="h-6 w-6 text-zinc-600" />
                            </div>
                            <p className="text-sm font-medium text-zinc-500">No recent activities</p>
                            <p className="text-[10px] text-zinc-600 px-8 mt-1">Background tasks like mind map generation will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-4 text-left transition-colors border-b border-white/5 last:border-0 hover:bg-white/[0.03]",
                                        !n.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            {getIcon(n.type)}
                                            <span className={cn("text-xs font-bold", !n.read ? "text-white" : "text-zinc-400")}>
                                                {n.message}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-medium text-zinc-600 whitespace-nowrap">
                                            {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                                        </span>
                                    </div>
                                    {n.details && (
                                        <p className="text-[11px] text-zinc-500 mt-1 pl-6 line-clamp-2">
                                            {n.details}
                                        </p>
                                    )}
                                    {n.link && (
                                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold mt-2 pl-6 uppercase tracking-widest">
                                            View details <ChevronRight className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
