import { useTranslation } from "react-i18next";
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
	const { wizardMode, setWizardMode } = useConfigurationState();
	const { t } = useTranslation();

	return (
		<fieldset className="grid max-w-[560px] gap-2">
			<legend className="sr-only">
				{t("configuration_page.cannon_type_title")}
			</legend>
			{CANNON_MODES.map((mode) => {
				const selected = wizardMode === mode.value;
				return (
					<label
						key={mode.value}
						className={cn(
							"flex items-start gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
							selected ? "border-foreground bg-muted/40" : "hover:bg-muted/40",
						)}
					>
						<input
							type="radio"
							name="cannon-mode"
							value={mode.value}
							checked={selected}
							onChange={() => setWizardMode(mode.value)}
							className="mt-0.5 size-4 shrink-0 accent-foreground"
						/>
						<span className="flex flex-col gap-1">
							<span className="text-sm font-medium">{t(mode.titleKey)}</span>
							<span className="text-[13px] text-muted-foreground">
								{t(mode.descKey)}
							</span>
						</span>
					</label>
				);
			})}
		</fieldset>
	);
}
