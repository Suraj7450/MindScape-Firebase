import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CinematicImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
}

/**
 * CinematicImage - Image component with 3D render effects
 * 
 * Features:
 * - 3D hover transform
 * - Glow effect
 * - Shine animation
 * - Shadow depth
 * - Enhanced contrast/saturation
 */
export function CinematicImage({
    src,
    alt,
    width = 512,
    height = 288,
    className,
    priority = false
}: CinematicImageProps) {
    return (
        <div className={cn("relative group cursor-pointer", className)}>
            {/* 3D Container with perspective */}
            <div className="relative overflow-hidden rounded-xl transform-gpu transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">

                {/* Animated Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl -z-10" />

                {/* Main Image */}
                <div className="relative z-10 overflow-hidden rounded-xl">
                    <Image
                        src={src}
                        alt={alt}
                        width={width}
                        height={height}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        style={{
                            filter: 'contrast(1.1) saturate(1.2) brightness(1.05)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                        }}
                        priority={priority}
                    />

                    {/* 3D Border Effect */}
                    <div className="absolute inset-0 border-2 border-white/10 rounded-xl pointer-events-none" />

                    {/* Shine Effect on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
            </div>

            {/* 3D Shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/40 blur-xl rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        </div>
    );
}

/**
 * CinematicImageSkeleton - Loading skeleton for cinematic images
 */
export function CinematicImageSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("relative", className)}>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse">
                <div className="w-full aspect-video" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>

            {/* Shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/40 blur-xl rounded-full" />
        </div>
    );
}
