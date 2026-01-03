
'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { MindMapData, SubCategory } from '@/types/mind-map';
import { cn, toPascalCase } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, ZoomIn, ZoomOut, Move } from 'lucide-react';

// --- Types ---

interface NodePosition {
    id: string;
    x: number;
    y: number;
    data: any;
    type: 'root' | 'subtopic' | 'category' | 'subcategory';
    parentId?: string;
    width: number;
    height: number;
}

interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    path: string;
}

interface MindMapRadialViewProps {
    data: MindMapData;
    onNodeClick?: (node: any) => void;
    onGenerateNewMap: (topic: string, parentTopic?: string) => void;
    generatingNode?: string | null;
}

// --- Constants (Tuning Knobs) ---

const ROOT_WIDTH = 240;
const ROOT_HEIGHT = 80;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;
const LEAF_WIDTH = 180;
const LEAF_HEIGHT = 50;

const H_SPACING = 350; // Horizontal gap between tiers
const V_SPACING = 30;  // Vertical gap between siblings
const ROOT_X = 100;    // Starting X

// --- Layout Engine (Pure & Deterministic) ---

/**
 * Calculates the bounding box height of a node and its children recursively.
 * This ensures parents are centered relative to their children.
 */
const calculateSubtreeHeight = (node: any, type: 'subtopic' | 'category' | 'subcategory'): number => {
    let children: any[] = [];
    let childType: 'category' | 'subcategory' | null = null;
    let nodeHeight = 0;

    if (type === 'subtopic') {
        children = node.categories || [];
        childType = 'category';
        nodeHeight = NODE_HEIGHT;
    } else if (type === 'category') {
        children = node.subCategories || [];
        childType = 'subcategory';
        nodeHeight = NODE_HEIGHT;
    } else {
        return LEAF_HEIGHT; // Leaf nodes have fixed height
    }

    if (children.length === 0) return nodeHeight;

    const childrenHeight = children.reduce((acc, child) => acc + calculateSubtreeHeight(child, childType as any), 0);
    const spacingHeight = (children.length - 1) * V_SPACING;

    // The subtree height is the max of the node itself or its expanded children
    return Math.max(nodeHeight, childrenHeight + spacingHeight);
};

const LayoutEngine = (data: MindMapData) => {
    const nodes: NodePosition[] = [];
    const connections: Connection[] = [];

    // 1. Place Root (Dead center vertical reference not needed yet, we center later)
    const rootNode: NodePosition = {
        id: 'root',
        x: ROOT_X,
        y: 0, // Will be adjusted
        data: { label: data.topic, icon: data.icon },
        type: 'root',
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT
    };
    nodes.push(rootNode);

    // 2. Recursive Placement
    let currentY = 0;

    // We need to calculate total height first to center the root
    let totalTreeHeight = 0;

    // Process SubTopics (Level 1)
    data.subTopics.forEach((st, stIdx) => {
        const stHeight = calculateSubtreeHeight(st, 'subtopic');
        const stY = currentY + stHeight / 2; // Center relative to own subtree range

        // Place SubTopic Node
        const stNode: NodePosition = {
            id: `st-${stIdx}`,
            x: ROOT_X + H_SPACING,
            y: stY,
            data: { label: st.name, icon: st.icon },
            type: 'subtopic',
            parentId: 'root',
            width: NODE_WIDTH,
            height: NODE_HEIGHT
        };
        nodes.push(stNode);

        // Process Categories (Level 2)
        let catCurrentY = currentY; // Start at the top of this subtopic's slot

        st.categories.forEach((cat, catIdx) => {
            const catHeight = calculateSubtreeHeight(cat, 'category');
            const catY = catCurrentY + catHeight / 2;

            const catNode: NodePosition = {
                id: `st-${stIdx}-cat-${catIdx}`,
                x: ROOT_X + H_SPACING * 2,
                y: catY,
                data: { label: cat.name, icon: cat.icon },
                type: 'category',
                parentId: `st-${stIdx}`,
                width: NODE_WIDTH,
                height: NODE_HEIGHT
            };
            nodes.push(catNode);

            // Process SubCategories (Level 3 - Leaves)
            let subCatCurrentY = catCurrentY;
            cat.subCategories.forEach((subCat, scIdx) => {
                const subCatHeight = LEAF_HEIGHT;
                const subCatY = subCatCurrentY + subCatHeight / 2;

                const subCatNode: NodePosition = {
                    id: `st-${stIdx}-cat-${catIdx}-sub-${scIdx}`,
                    x: ROOT_X + H_SPACING * 3,
                    y: subCatY,
                    data: { label: subCat.name, ...subCat }, // pass full data for actions
                    type: 'subcategory',
                    parentId: `st-${stIdx}-cat-${catIdx}`,
                    width: LEAF_WIDTH,
                    height: LEAF_HEIGHT
                };
                nodes.push(subCatNode);

                subCatCurrentY += subCatHeight + V_SPACING;
            });

            if (cat.subCategories.length === 0) {
                // Reserve space even if empty to avoid overlap
                catCurrentY += catHeight + V_SPACING;
            } else {
                catCurrentY = subCatCurrentY; // Advance by what was consumed
            }
        });

        if (st.categories.length === 0) {
            currentY += stHeight + V_SPACING;
        } else {
            currentY = catCurrentY; // Advance outer Y
        }
    });

    totalTreeHeight = currentY;

    // 3. Center Everything Vertically
    // We want the average Y of all nodes to be approx screen center, 
    // but easier: just shift root to calculate mid Y of the tree.
    // Actually, root should be at `totalTreeHeight / 2`.

    rootNode.y = totalTreeHeight / 2;

    // 4. Generate Connections (Bézier Curves)
    nodes.forEach(node => {
        if (node.parentId) {
            const parent = nodes.find(n => n.id === node.parentId);
            if (parent) {
                // Attach right of parent to left of child
                const sourceX = parent.x + parent.width;
                const sourceY = parent.y; // Center
                const targetX = node.x;
                const targetY = node.y;   // Center

                // Bézier Control Points
                // Control point 1: Halfway horizontal, same Y as source
                // Control point 2: Halfway horizontal, same Y as target
                const midX = (sourceX + targetX) / 2;

                const path = `
                    M ${sourceX} ${sourceY}
                    C ${midX} ${sourceY},
                      ${midX} ${targetY},
                      ${targetX} ${targetY}
                `;

                connections.push({
                    id: `e-${parent.id}-${node.id}`,
                    sourceId: parent.id,
                    targetId: node.id,
                    path
                });
            }
        }
    });

    return { nodes, connections, width: ROOT_X + H_SPACING * 4, height: totalTreeHeight };
};

// --- Components ---

export const MindMapRadialView = ({ data, onNodeClick, onGenerateNewMap, generatingNode }: MindMapRadialViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const { nodes, connections, width, height } = useMemo(() => LayoutEngine(data), [data]);

    // Initial Center and Zoom
    useEffect(() => {
        if (containerRef.current) {
            const clientH = containerRef.current.clientHeight;
            // Tree content ranges from Y=0 to Y=height
            // We want (height/2) * zoom + offsetY = clientH / 2
            const initialY = (clientH / 2) - (height / 2) * zoom;
            setOffset({ x: 50, y: initialY });
        }
    }, [height]); // Run once on mount/height change (ignore zoom to prevent drift)

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.min(Math.max(z * delta, 0.4), 2));
        } else {
            // Pan
            setOffset(o => ({ ...o, x: o.x - e.deltaX, y: o.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const zoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
    const zoomOut = () => setZoom(z => Math.max(z - 0.1, 0.4));
    const resetZoom = () => {
        setZoom(1);
        if (containerRef.current) {
            const clientH = containerRef.current.clientHeight;
            const initialY = (clientH / 2) - (height / 2); // Reset to 1x zoom centering
            setOffset({ x: 50, y: initialY });
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-zinc-950/95 relative overflow-hidden cursor-grab active:cursor-grabbing group"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
                }}
            />

            {/* Transform Container */}
            <div
                className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
                }}
            >
                <svg width={width} height={height} className="overflow-visible pointer-events-none">
                    <defs>
                        <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                    {connections.map(conn => (
                        <path
                            key={conn.id}
                            d={conn.path}
                            fill="none"
                            stroke="url(#link-gradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="drop-shadow-[0_0_2px_rgba(168,85,247,0.3)]"
                        />
                    ))}
                </svg>

                {nodes.map(node => {
                    const Icon = (LucideIcons as any)[toPascalCase(node.data.icon || 'circle')] || LucideIcons.Circle;
                    const isLeaf = node.type === 'subcategory';

                    return (
                        <div
                            key={node.id}
                            className={cn(
                                "absolute flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg transition-all duration-200 select-none",
                                "max-w-[260px] min-w-[150px] whitespace-normal break-words leading-snug", // Dynamic sizing
                                node.type === 'root' ? "bg-gradient-to-br from-purple-600 to-indigo-700 border-white/20 text-white shadow-purple-500/20 z-30" :
                                    node.type === 'subtopic' ? "bg-zinc-900 border-indigo-500/30 text-zinc-100 shadow-indigo-500/10 z-20" :
                                        node.type === 'category' ? "bg-zinc-900/80 border-white/10 text-zinc-300 z-10" :
                                            "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white hover:bg-zinc-800 z-10 cursor-pointer"
                            )}
                            style={{
                                left: node.x,
                                top: node.y,
                                transform: 'translate(0, -50%)', // Center Y anchor logic
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isLeaf && onGenerateNewMap) {
                                    onGenerateNewMap(node.data.name, node.id);
                                }
                                if (onNodeClick) onNodeClick(node.data);
                            }}
                        >
                            <div className={cn(
                                "flex items-center justify-center rounded-lg flex-shrink-0",
                                node.type === 'root' ? "bg-white/20 p-2" :
                                    isLeaf ? "bg-white/5 p-1.5" :
                                        "bg-white/10 p-2"
                            )}>
                                <Icon className={cn(
                                    node.type === 'root' ? "w-6 h-6" : "w-4 h-4"
                                )} />
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className={cn(
                                    "block font-orbitron", // Ensure block display for wrapping
                                    node.type === 'root' ? "text-xl font-bold tracking-tight" :
                                        node.type === 'subtopic' ? "text-sm font-bold uppercase tracking-wide" :
                                            "text-xs font-medium"
                                )}>
                                    {node.data.label}
                                </span>
                                {isLeaf && generatingNode === node.data.name && (
                                    <span className="text-[9px] text-purple-400 flex items-center gap-1 animate-pulse">
                                        <Loader2 className="w-2 h-2 animate-spin" />
                                        Wait...
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls Overlay - Top Right */}
            <div className="absolute top-6 right-6 flex flex-col gap-2 z-50">
                <button onClick={zoomIn} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-purple-500/20 hover:border-purple-500/40 backdrop-blur-md transition-all flex items-center justify-center font-bold text-lg">
                    +
                </button>
                <button onClick={zoomOut} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-purple-500/20 hover:border-purple-500/40 backdrop-blur-md transition-all flex items-center justify-center font-bold text-lg">
                    −
                </button>
                <button onClick={resetZoom} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-purple-500/20 hover:border-purple-500/40 backdrop-blur-md transition-all flex items-center justify-center">
                    <Move className="w-4 h-4" />
                </button>
            </div>

            <div className="absolute top-6 left-6 z-50 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-400 flex items-center gap-2 pointer-events-none uppercase tracking-[0.2em] font-orbitron">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                MINDFLOW VIEW
            </div>
        </div>
    );
};
