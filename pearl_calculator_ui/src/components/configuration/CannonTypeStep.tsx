import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { cn } from "@/lib/utils";
import type { CannonMode } from "@/types/domain";

interface ModeOption {
	value: CannonMode;
	titleKey:
		| "configuration_page.mode_standard_title"
		| "configuration_page.mode_accumulation_title"
		| "configuration_page.mode_vector3d_title";
	descKey:
		| "configuration_page.mode_standard_desc"
		| "configuration_page.mode_accumulation_desc"
		| "configuration_page.mode_vector3d_desc";
}

const CANNON_MODES: ModeOption[] = [
	{
		value: "Standard",
		titleKey: "configuration_page.mode_standard_title",
		descKey: "configuration_page.mode_standard_desc",
	},
	{
		value: "Accumulation",
		titleKey: "configuration_page.mode_accumulation_title",
		descKey: "configuration_page.mode_accumulation_desc",
	},
	{
		value: "Vector3D",
		titleKey: "configuration_page.mode_vector3d_title",
		descKey: "configuration_page.mode_vector3d_desc",
	},
];

export function CannonTypeStep() {
	const { calculationMode, setCalculationMode } = useConfigurationState();
	const { t } = useTranslation();

	return (
		<div className="min-h-full flex items-center justify-center px-4 pb-4 pt-15">
			<Card className="w-[500px]">
				<CardHeader>
					<CardTitle>{t("configuration_page.cannon_type_title")}</CardTitle>
					<CardDescription>
						{t("configuration_page.cannon_type_desc")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3">
						{CANNON_MODES.map((mode) => (
							<button
								key={mode.value}
								type="button"
								onClick={() => setCalculationMode(mode.value)}
								className={cn(
									"w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
									"hover:border-primary/50 hover:bg-accent/50",
									calculationMode === mode.value
										? "border-primary bg-primary/5 shadow-sm"
										: "border-muted bg-background",
								)}
							>
								<div className="font-medium">{t(mode.titleKey)}</div>
								<div className="text-sm text-muted-foreground mt-1">
									{t(mode.descKey)}
								</div>
							</button>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
