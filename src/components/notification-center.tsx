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
    BellOff,
    Activity
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
import { useActivity } from '@/contexts/activity-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHANGELOG_DATA } from '@/lib/changelog-data';
import { Badge } from '@/components/ui/badge';

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const router = useRouter();
    const { status, aiHealth, activeTaskName } = useActivity();

    const isBusy = status !== 'idle' || aiHealth.some(h => h.status !== 'healthy');

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
                    <Bell className={cn("h-5 w-5", unreadCount > 0 && !isBusy ? "text-primary" : "text-zinc-400")} />
                    {(unreadCount > 0 || isBusy) && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className={cn(
                                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                isBusy ? "bg-amber-400 duration-1000" : "bg-primary"
                            )}></span>
                            <span className={cn(
                                "relative inline-flex rounded-full h-2 w-2",
                                isBusy ? "bg-amber-500" : "bg-primary"
                            )}></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 glassmorphism p-0 overflow-hidden" align="end" forceMount>
                <Tabs defaultValue="activities" className="w-full">
                    <div className="px-4 pt-4 border-b border-white/5">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl h-9">
                            <TabsTrigger
                                value="activities"
                                className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                            >
                                Activities
                            </TabsTrigger>
                            <TabsTrigger
                                value="changelog"
                                className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5"
                            >
                                What's New
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="activities" className="m-0 focus:outline-none">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                            <DropdownMenuLabel className="p-0 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">History</DropdownMenuLabel>
                            <div className="flex gap-2">
                                {notifications.length > 0 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-white"
                                            onClick={markAllAsRead}
                                        >
                                            Mark All Read
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-zinc-500 hover:text-red-400"
                                            onClick={clearNotifications}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {isBusy && (
                            <div className="p-4 border-b border-white/5 bg-amber-500/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase italic">Quantum Materializing</span>
                                </div>
                                <div className="space-y-2">
                                    {aiHealth.length > 0 ? (
                                        aiHealth.map(h => (
                                            <div key={h.name} className="flex justify-between items-center text-[9px] uppercase font-mono gap-4 pl-4 border-l-2 border-white/10">
                                                <span className="text-zinc-500">{h.name}</span>
                                                <span className={h.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}>{h.status}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center text-[9px] uppercase font-mono gap-4 pl-4 border-l-2 border-white/10">
                                            <span className="text-zinc-500 truncate max-w-[150px]" title={activeTaskName ? `Generating Submap: ${activeTaskName}` : "Mind Map Generation"}>
                                                {activeTaskName ? `Map: ${activeTaskName}` : "AI Core Activity"}
                                            </span>
                                            <span className="text-amber-400 animate-pulse">Running</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <ScrollArea className="h-[350px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                        <BellOff className="h-6 w-6 text-zinc-700" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No recent activity</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {notifications.map((n) => (
                                        <button
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={cn(
                                                "flex flex-col items-start gap-1 p-4 text-left transition-colors border-b border-white/5 last:border-0 hover:bg-white/[0.03]",
                                                !n.read && "bg-white/[0.04]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <div className="flex items-center gap-2">
                                                    {getIcon(n.type)}
                                                    <span className={cn("text-[11px] font-bold tracking-tight", !n.read ? "text-white" : "text-zinc-500")}>
                                                        {n.message}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-medium text-zinc-700 whitespace-nowrap">
                                                    {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                                                </span>
                                            </div>
                                            {n.details && (
                                                <p className="text-[10px] text-zinc-500 mt-1 pl-6 line-clamp-2 leading-relaxed">
                                                    {n.details}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="changelog" className="m-0 focus:outline-none">
                        <ScrollArea className="h-[400px]">
                            <div className="p-4 space-y-6">
                                {CHANGELOG_DATA.map((version, vIdx) => (
                                    <div key={vIdx} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
                                                    v{version.version}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-white">{version.title}</span>
                                            </div>
                                            <span className="text-[9px] text-zinc-600 font-medium">{version.date}</span>
                                        </div>

                                        <div className="space-y-2">
                                            {version.highlights.map((highlight, hIdx) => (
                                                <div key={hIdx} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
                                                    <div className={cn("flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", highlight.color)}>
                                                        <highlight.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-300 group-hover:text-primary transition-colors">
                                                            {highlight.title}
                                                        </h4>
                                                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                                                            {highlight.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {vIdx < CHANGELOG_DATA.length - 1 && <DropdownMenuSeparator className="bg-white/5" />}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
