import {
    runTransaction,
    doc,
    collection,
    serverTimestamp,
    Firestore,
} from 'firebase/firestore';
import { z } from 'zod';
import { MindMapMeta, MindMapMetaSchema } from '../schemas/mindmap';
import { MindMapNode, MindMapNodeSchema } from '../schemas/node';

/**
 * Validate data against a Zod schema or throw a descriptive error.
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.error('Validation Error:', result.error.format());
        throw new Error('Invalid data structure: ' + JSON.stringify(result.error.format()));
    }
    return result.data;
}

/**
 * Atomically create a new Mind Map and its Root Node.
 */
export async function createMindMapTransaction(
    firestore: Firestore,
    userId: string,
    meta: Omit<MindMapMeta, 'uid' | 'createdAt' | 'updatedAt' | 'rootNodeId'>,
    rootNode: Omit<MindMapNode, 'createdAt' | 'updatedAt' | 'parentId' | 'depth' | 'order'>
) {
    return await runTransaction(firestore, async (tx) => {
        // Generate IDs locally so we can reference them
        const mapRef = doc(collection(firestore, 'users', userId, 'mindmaps'));
        const nodeRef = doc(collection(mapRef, 'nodes'));

        const now = serverTimestamp();

        const validatedMeta = validateOrThrow(MindMapMetaSchema, {
            ...meta,
            uid: userId,
            createdAt: now,
            updatedAt: now,
            rootNodeId: nodeRef.id,
        });

        const validatedNode = validateOrThrow(MindMapNodeSchema, {
            ...rootNode,
            parentId: null,
            depth: 0,
            order: 0,
            createdAt: now,
            updatedAt: now,
            tags: rootNode.tags || [],
        });

        tx.set(mapRef, validatedMeta);
        tx.set(nodeRef, validatedNode);

        return { mapId: mapRef.id, rootNodeId: nodeRef.id };
    });
}

/**
 * Atomically add a new Node to an existing Mind Map.
 */
export async function addNodeTransaction(
    firestore: Firestore,
    userId: string,
    mindmapId: string,
    node: Omit<MindMapNode, 'createdAt' | 'updatedAt'>
) {
    return await runTransaction(firestore, async (tx) => {
        const mapRef = doc(firestore, 'users', userId, 'mindmaps', mindmapId);
        const mapSnap = await tx.get(mapRef);

        if (!mapSnap.exists()) {
            throw new Error('Mind map does not exist');
        }

        const nodeRef = doc(collection(mapRef, 'nodes'));
        const now = serverTimestamp();

        const validatedNode = validateOrThrow(MindMapNodeSchema, {
            ...node,
            createdAt: now,
            updatedAt: now,
        });

        tx.set(nodeRef, validatedNode);

        // Optional: update stats on parent map
        const currentStats = mapSnap.data().stats || {};
        tx.update(mapRef, {
            'stats.nodeCount': (currentStats.nodeCount || 0) + 1,
            updatedAt: now,
        });

        return nodeRef.id;
    });
}
