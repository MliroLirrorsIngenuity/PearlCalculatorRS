export type ThemeColor = "blue" | "red";

export interface ThemeClasses {
    text: string;
    arrow: string;
    container: string;
    input: string;
}

export const THEME_CLASSES: Record<ThemeColor, ThemeClasses> = {
    blue: {
        text: "text-blue-600",
        arrow: "text-blue-400",
        container: "bg-blue-50/50 border-blue-100",
        input:
            "border-blue-200 hover:border-blue-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-blue-200/50 text-blue-700 font-bold",
    },
    red: {
        text: "text-red-600",
        arrow: "text-red-400",
        container: "bg-red-50/50 border-red-100",
        input:
            "border-red-200 hover:border-red-300 focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-500/20 placeholder:text-red-200/50 text-red-700 font-bold",
    },
};

export const LAYOUT_CONSTANTS = {
    CELL_WIDTH: 48 + 6,
    ARROW_WIDTH: 16 + 8,
    DIRECTION_WIDTH: 160,
    PADDING: 40,
    ITEM_WIDTH: 54, // 48px Input + 6px Gap
    CONTAINER_PADDING: 32, // px-4 = 16px * 2
    SAFETY_BUFFER: 40,
    STAGGER_OFFSET: 32,
};

export function calculateRequiredWidth(sideCount: number): number {
    const { CELL_WIDTH, ARROW_WIDTH, DIRECTION_WIDTH, PADDING } = LAYOUT_CONSTANTS;
    return (sideCount * CELL_WIDTH + ARROW_WIDTH) * 2 + DIRECTION_WIDTH + PADDING;
}

export function getThemeClasses(color: ThemeColor): ThemeClasses {
    return THEME_CLASSES[color];
}

interface ChunkResult {
    chunks: string[][];
    indexChunks: number[][];
}

export function calculateRowChunks(
    values: string[],
    containerWidth: number,
    isRightToLeft: boolean
): ChunkResult {
    const indices = Array.from({ length: values.length }, (_, i) => i);
    if (containerWidth === 0) return { chunks: [values], indexChunks: [indices] };

    const valueResult: string[][] = [];
    const indexResult: number[][] = [];

    const { ITEM_WIDTH, CONTAINER_PADDING, SAFETY_BUFFER, STAGGER_OFFSET } = LAYOUT_CONSTANTS;

    const processingValues = isRightToLeft ? [...values].reverse() : values;
    const processingIndices = isRightToLeft ? [...indices].reverse() : indices;

    let currentIndex = 0;
    let rowIndex = 0;

    while (currentIndex < processingValues.length) {
        const row0Capacity = Math.floor(
            (containerWidth - CONTAINER_PADDING - SAFETY_BUFFER) / ITEM_WIDTH
        );
        if (rowIndex === 0 && processingValues.length <= row0Capacity) {
            valueResult.push(processingValues);
            indexResult.push(processingIndices);
            break;
        }

        const staggerOffset = rowIndex * STAGGER_OFFSET;
        const variableWidth =
            containerWidth - CONTAINER_PADDING - staggerOffset - SAFETY_BUFFER;
        const capacity = Math.max(1, Math.floor(variableWidth / ITEM_WIDTH));

        const nextIndex = currentIndex + capacity;
        valueResult.push(processingValues.slice(currentIndex, nextIndex));
        indexResult.push(processingIndices.slice(currentIndex, nextIndex));

        currentIndex = nextIndex;
        rowIndex++;
    }

    if (isRightToLeft) {
        return {
            chunks: valueResult.reverse(),
            indexChunks: indexResult.reverse(),
        };
    }

    return { chunks: valueResult, indexChunks: indexResult };
}
