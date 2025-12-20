import { z } from 'zod';

export const MindMapNodeSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    icon: z.string().optional(),
    tags: z.array(z.string()).max(10).optional(),
    parentId: z.string().nullable(),
    depth: z.number().min(0).max(20),
    order: z.number().int(),
    createdAt: z.any(),
    updatedAt: z.any(),
});

export type MindMapNode = z.infer<typeof MindMapNodeSchema>;
