import { useTranslation } from "react-i18next";
import { AxisInput } from "@/components/common/AxisInput";
import { sectionLabelClass } from "@/components/common/Metric";
import { useConfigurationState } from "@/context/ConfigurationStateContext";

interface BasicInfoStepProps {
	errors: Record<string, string>;
	onForceNext?: () => void;
}

function Field({
	label,
	hint,
	children,
}: {
	label: string;
	hint: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<span className={sectionLabelClass}>{label}</span>
			{children}
			<p className="text-xs text-muted-foreground">{hint}</p>
		</section>
	);
}

export function BasicInfoStep({ errors, onForceNext }: BasicInfoStepProps) {
	const { draftConfig, setDraftConfig, wizardMode } = useConfigurationState();
	const { t } = useTranslation();

	const update = (patch: Partial<typeof draftConfig>) =>
		setDraftConfig({ ...draftConfig, ...patch });

	const tabToNext: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
		if (event.key === "Tab" && !event.shiftKey) {
			event.preventDefault();
			onForceNext?.();
		}
	};

	const limit =
		wizardMode === "Vector3D"
			? {
					label: t("configuration_page.max_vertical_tnt_label"),
					hint: t("configuration_page.max_vertical_tnt_desc"),
					value: draftConfig.max_vertical_tnt,
					error: errors.max_vertical_tnt,
					onChange: (v: string) => update({ max_vertical_tnt: v }),
				}
			: wizardMode === "Standard"
				? {
						label: t("configuration_page.max_tnt_label"),
						hint: t("configuration_page.max_tnt_desc"),
						value: draftConfig.max_tnt,
						error: errors.max_tnt,
						onChange: (v: string) => update({ max_tnt: v }),
					}
				: null;

	return (
		<div className="flex max-w-[560px] flex-col gap-6">
			<Field
				label={t("configuration_page.pearl_coord_label")}
				hint={t("configuration_page.pearl_coord_desc")}
			>
				<div className="grid grid-cols-3 gap-3">
					<AxisInput
						axis="X"
						id="wizard-pearl-x"
						value={draftConfig.pearl_x_position}
						onValueChange={(v) => update({ pearl_x_position: v })}
						error={errors.pearl_x}
					/>
					<AxisInput
						axis="Y"
						id="wizard-pearl-y"
						value={draftConfig.pearl_y_position}
						onValueChange={(v) => update({ pearl_y_position: v })}
						error={errors.pearl_y}
					/>
					<AxisInput
						axis="Z"
						id="wizard-pearl-z"
						value={draftConfig.pearl_z_position}
						onValueChange={(v) => update({ pearl_z_position: v })}
						error={errors.pearl_z}
					/>
				</div>
			</Field>

			<Field
				label={t("configuration_page.pearl_momentum_label")}
				hint={t("configuration_page.pearl_momentum_desc")}
			>
				<div className="grid grid-cols-3 gap-3">
					<AxisInput
						axis="X"
						id="wizard-motion-x"
						value={draftConfig.pearl_x_motion}
						onValueChange={(v) => update({ pearl_x_motion: v })}
						error={errors.momentum_x}
					/>
					<AxisInput
						axis="Y"
						id="wizard-motion-y"
						value={draftConfig.pearl_y_motion}
						onValueChange={(v) => update({ pearl_y_motion: v })}
						error={errors.momentum_y}
					/>
					<AxisInput
						axis="Z"
						id="wizard-motion-z"
						value={draftConfig.pearl_z_motion}
						onValueChange={(v) => update({ pearl_z_motion: v })}
						error={errors.momentum_z}
						onKeyDown={limit ? undefined : tabToNext}
					/>
				</div>
			</Field>

			{limit && (
				<Field label={limit.label} hint={limit.hint}>
					<div className="grid grid-cols-3 gap-3">
						<AxisInput
							axis="#"
							id="wizard-max-tnt"
							value={limit.value}
							onValueChange={limit.onChange}
							error={limit.error}
							onKeyDown={tabToNext}
						/>
					</div>
				</Field>
			)}
		</div>
	);
}
