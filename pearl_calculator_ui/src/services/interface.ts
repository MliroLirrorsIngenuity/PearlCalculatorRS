import { PearlTraceResult, TNTResult } from "@/types/domain";


export interface Space3DInput {
    x: number;
    y: number;
    z: number;
}

export interface CalculationInput {
    pearlX: number;
    pearlY: number;
    pearlZ: number;
    pearlMotionX: number;
    pearlMotionY: number;
    pearlMotionZ: number;
    offsetX: number;
    offsetZ: number;
    cannonY: number;
    northWestTnt: Space3DInput;
    northEastTnt: Space3DInput;
    southWestTnt: Space3DInput;
    southEastTnt: Space3DInput;
    defaultRedDirection: string;
    defaultBlueDirection: string;
    destinationX: number;
    destinationZ: number;
    maxTnt: number;
    maxTicks: number;
    maxDistance: number;
    version: string;
}

export interface PearlTraceInput {
    redTnt: number;
    blueTnt: number;
    pearlX: number;
    pearlY: number;
    pearlZ: number;
    pearlMotionX: number;
    pearlMotionY: number;
    pearlMotionZ: number;
    offsetX: number;
    offsetZ: number;
    cannonY: number;
    northWestTnt: Space3DInput;
    northEastTnt: Space3DInput;
    southWestTnt: Space3DInput;
    southEastTnt: Space3DInput;
    defaultRedDirection: string;
    defaultBlueDirection: string;
    destinationX: number;
    destinationZ: number;
    direction?: string;
    version: string;
}

export interface TntGroupInput {
    x: number;
    y: number;
    z: number;
    amount: number;
}

export interface RawTraceInput {
    pearlX: number;
    pearlY: number;
    pearlZ: number;
    pearlMotionX: number;
    pearlMotionY: number;
    pearlMotionZ: number;
    tntGroups: TntGroupInput[];
    version: string;
}

export interface ICalculatorService {
    calculateTNTAmount(input: CalculationInput): Promise<TNTResult[]>;
    calculatePearlTrace(input: PearlTraceInput): Promise<PearlTraceResult>;
    calculateRawTrace(input: RawTraceInput): Promise<PearlTraceResult>;
}
