import { ClipboardPaste, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
	ActionCard,
	actionCardClass,
	actionIconClass,
} from "@/components/common/ActionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useConfigActions } from "@/hooks/use-config-actions";
import { clearConfigPlugins } from "@/plugins/config-plugins";

export function ConfigOnboarding() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const { importFromFile, importFromCode } = useConfigActions();
	const { resetConfig, setHasConfig } = useConfig();
	const { resetDefaultCalculator } = useCalculatorState();
	const { setCalculationMode } = useConfigurationState();

	const skip = () => {
		void clearConfigPlugins();
		resetConfig();
		resetDefaultCalculator();
		setCalculationMode("Standard");
		setHasConfig(true);
	};

	return (
		<div className="flex h-full w-full items-center justify-center overflow-auto rounded-xl border bg-card p-6">
			<div className="flex w-full max-w-[820px] flex-col gap-6">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-2xl font-bold tracking-tight">
						{t("onboarding.title")}
					</h1>
					<p className="text-muted-foreground">{t("onboarding.description")}</p>
				</div>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<button
						type="button"
						onClick={importFromFile}
						className="flex min-h-[190px] flex-col items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-dashed bg-muted/50 text-center transition-colors hover:bg-muted"
					>
						<span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
							<Upload className="size-5" />
						</span>
						<span className="font-semibold">{t("onboarding.drop_title")}</span>
						<span className="text-[13px] text-muted-foreground">
							{t("onboarding.drop_hint")}
						</span>
					</button>
					<form
						className={actionCardClass}
						onSubmit={(event) => {
							event.preventDefault();
							importFromCode(code.trim() || undefined);
						}}
					>
						<span className={actionIconClass}>
							<ClipboardPaste />
						</span>
						<label htmlFor="onboarding-code" className="font-semibold">
							{t("onboarding.code_title")}
						</label>
						<Input
							id="onboarding-code"
							value={code}
							onChange={(event) => setCode(event.target.value)}
							placeholder={t("onboarding.code_placeholder")}
							className="h-[34px] text-[13px]"
						/>
						<Button type="submit" size="sm" className="mt-auto">
							{t("onboarding.code_import")}
						</Button>
					</form>
					<ActionCard
						icon={<Plus />}
						title={t("onboarding.new_title")}
						hint={t("onboarding.new_hint")}
						action={t("onboarding.new_action")}
						onClick={() => navigate("/configuration")}
					/>
				</div>
				<button
					type="button"
					onClick={skip}
					className="self-start text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					{t("onboarding.skip")}
				</button>
			</div>
		</div>
	);
}
