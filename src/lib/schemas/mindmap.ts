import { z } from 'zod';

export const MindMapMetaSchema = z.object({
    uid: z.string().min(1),
    topic: z.string().min(2).max(200),
    summary: z.string().max(3000).optional(),
    thumbnailUrl: z.string().url().optional(),
    visibility: z.enum(['private', 'public']),
    createdAt: z.any(),
    updatedAt: z.any(),
    rootNodeId: z.string().optional(),
});

export type MindMapMeta = z.infer<typeof MindMapMetaSchema>;
