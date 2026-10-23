import {
	Calculator,
	type LucideIcon,
	PlusSquare,
	Rotate3d,
} from "lucide-react";
import type { PearlVersion } from "@/types/domain";

export interface NavItem {
	to: string;
	icon: LucideIcon;
	labelKey: "nav.calculator" | "nav.simulator" | "nav.configuration";
}

export const NAV_ITEMS: NavItem[] = [
	{ to: "/", icon: Calculator, labelKey: "nav.calculator" },
	{ to: "/simulator", icon: Rotate3d, labelKey: "nav.simulator" },
	{ to: "/configuration", icon: PlusSquare, labelKey: "nav.configuration" },
];

export const PEARL_VERSIONS: {
	value: PearlVersion;
	name: string;
	short: string;
}[] = [
	{ value: "Legacy", name: "1.20.4 & Older", short: "≤1.20.4" },
	{ value: "Post1205", name: "1.20.5 - 1.21.1", short: "1.20.5+" },
	{ value: "Post1212", name: "1.21.2+", short: "1.21.2+" },
];

export const LANGUAGES = [
	{ code: "zh", name: "中文" },
	{ code: "en", name: "English" },
] as const;
