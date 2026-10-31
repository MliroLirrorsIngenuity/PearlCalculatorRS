import {
	Calculator,
	Check,
	ChevronLeft,
	ChevronRight,
	ClipboardCopy,
	ClipboardPaste,
	FileUp,
	FolderOpen,
	OctagonAlert,
	Plus,
	RotateCcw,
	Save,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ActionCard } from "@/components/common/ActionCard";
import { sectionLabelClass } from "@/components/common/Metric";
import { BasicInfoStep } from "@/components/configuration/BasicInfoStep";
import { BitConfigurationStep } from "@/components/configuration/BitConfigurationStep";
import { CannonTypeStep } from "@/components/configuration/CannonTypeStep";
import { MultiplierConfigurationStep } from "@/components/configuration/MultiplierConfigurationStep";
import { PreviewStep } from "@/components/configuration/PreviewStep";
import { TNTConfigurationStep } from "@/components/configuration/TNTConfigurationStep";
import { VerticalTNTStep } from "@/components/configuration/VerticalTNTStep";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useMobileView } from "@/context/MobileViewContext";
import { useConfigurationController } from "@/hooks/use-configuration-controller";
import { cn } from "@/lib/utils";
import { isTauri } from "@/services";

interface WizardStep {
	id: string;
	title: string;
	description: string;
	body: React.ReactNode;
}

function CenteredPanel({
	title,
	description,
	icon,
	children,
}: {
	title: string;
	description: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Card className="h-full w-full items-center justify-center gap-0 overflow-auto p-6">
			<div className="flex w-full max-w-[820px] flex-col gap-6">
				<div className="flex flex-col gap-1.5">
					{icon && (
						<span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-foreground text-background [&_svg]:size-5">
							{icon}
						</span>
					)}
					<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
					<p className="text-muted-foreground">{description}</p>
				</div>
				{children}
			</div>
		</Card>
	);
}

function StepList({
	steps,
	current,
	reached,
	onSelect,
}: {
	steps: WizardStep[];
	current: number;
	reached: number;
	onSelect: (step: number) => void;
}) {
	return (
		<ol className="flex flex-col gap-0.5">
			{steps.map((step, index) => {
				const number = index + 1;
				const done = number < current;
				const active = number === current;
				const reachable = number <= reached;
				return (
					<li key={step.id}>
						<button
							type="button"
							disabled={active || !reachable}
							aria-current={active ? "step" : undefined}
							onClick={() => onSelect(number)}
							className={cn(
								"flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
								active && "bg-muted font-medium text-foreground",
								!active && reachable && "text-foreground hover:bg-muted/60",
								!reachable && "text-muted-foreground",
							)}
						>
							<span
								className={cn(
									"flex size-5 shrink-0 items-center justify-center rounded-[5px] border text-[11px] font-semibold tabular-nums",
									done && "border-foreground bg-foreground text-background",
									active && "border-foreground",
								)}
							>
								{done ? <Check className="size-3" /> : number}
							</span>
							<span className="truncate">{step.title}</span>
						</button>
					</li>
				);
			})}
		</ol>
	);
}

function ConfirmDialog({
	trigger,
	title,
	description,
	destructive = false,
	onConfirm,
}: {
	trigger: React.ReactNode;
	title: string;
	description: string;
	destructive?: boolean;
	onConfirm: () => void;
}) {
	const { t } = useTranslation();
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						{destructive && (
							<OctagonAlert className="size-5 text-destructive" />
						)}
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						{t("configuration_page.cancel_btn")}
					</AlertDialogCancel>
					<AlertDialogAction
						className={
							destructive
								? buttonVariants({ variant: "destructive" })
								: undefined
						}
						onClick={onConfirm}
					>
						{t("configuration_page.continue_btn")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default function Configuration() {
	const { t } = useTranslation();
	const { isMobile } = useMobileView();
	const { wizardMode, isFinished } = useConfigurationState();
	const isVector3D = wizardMode === "Vector3D";
	const isAccumulation = wizardMode === "Accumulation";
	const count = isVector3D || isAccumulation ? 6 : 5;
	const [current, setCurrent] = React.useState(() => (isFinished ? count : 1));
	const [reached, setReached] = React.useState(current);
	if (current > reached) setReached(current);

	const {
		isConfiguring,
		savedPath,
		shouldRestoreLastPage,
		setShouldRestoreLastPage,
		errors,
		validateStep,
		handleStart,
		handleReset,
		handleFinish,
		handleExport,
		handleOpenFolder,
		handleApplyToCalculator,
		handleCopyEncodedConfig,
		handleImportFromClipboard,
		handleImportFromFile,
		handleSkipBitConfiguration,
		setIsBitConfigSkipped,
		setIsMultiplierConfigSkipped,
	} = useConfigurationController();

	const goNext = () => setCurrent((step) => step + 1);

	const restart = () => {
		setCurrent(1);
		setReached(1);
	};

	const jumpTo = (target: number) => {
		for (let step = current; step < target; step++) {
			if (!validateStep(step)) {
				setCurrent(step);
				return;
			}
		}
		setCurrent(target);
	};

	const handleForceNext = () => {
		if (!validateStep(current)) return;
		goNext();
		setTimeout(() => {
			document.getElementById("tnt-config-start-input")?.focus();
		}, 300);
	};

	const steps: WizardStep[] = [
		{
			id: "type",
			title: t("configuration_page.cannon_type_title"),
			description: t("configuration_page.cannon_type_desc"),
			body: <CannonTypeStep />,
		},
		{
			id: "basic",
			title: t("configuration_page.basic_info_title"),
			description: t("configuration_page.basic_info_desc"),
			body: <BasicInfoStep errors={errors} onForceNext={handleForceNext} />,
		},
		{
			id: "tnt",
			title: t("configuration_page.tnt_config_title"),
			description: t("configuration_page.tnt_config_desc"),
			body: <TNTConfigurationStep errors={errors} />,
		},
		...(isVector3D
			? [
					{
						id: "vertical",
						title: t("configuration_page.vertical_tnt_config_title"),
						description: t("configuration_page.vertical_tnt_config_desc"),
						body: <VerticalTNTStep errors={errors} />,
					},
				]
			: []),
		{
			id: "bit",
			title: t("configuration_page.bit_config_title"),
			description: t("configuration_page.bit_config_desc"),
			body: <BitConfigurationStep errors={errors} />,
		},
		...(isAccumulation
			? [
					{
						id: "multiplier",
						title: t("configuration_page.multiplier_config_title"),
						description: t("configuration_page.multiplier_config_desc"),
						body: <MultiplierConfigurationStep errors={errors} />,
					},
				]
			: []),
		{
			id: "preview",
			title: t("configuration_page.preview_title"),
			description: t("configuration_page.preview_desc"),
			body: <PreviewStep />,
		},
	];
	const bitStep = isVector3D ? 5 : 4;
	const step = steps[Math.min(current, count) - 1];

	React.useEffect(() => {
		if (!shouldRestoreLastPage) return;
		setCurrent(count);
		setShouldRestoreLastPage(false);
	}, [shouldRestoreLastPage, setShouldRestoreLastPage, count]);

	React.useEffect(() => {
		if (current === bitStep) setIsBitConfigSkipped(false);
		if (isAccumulation && current === 5) setIsMultiplierConfigSkipped(false);
	}, [
		current,
		bitStep,
		isAccumulation,
		setIsBitConfigSkipped,
		setIsMultiplierConfigSkipped,
	]);

	if (!isConfiguring) {
		return (
			<CenteredPanel
				title={t("configuration_page.title")}
				description={t("configuration_page.description")}
			>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<ActionCard
						primary
						icon={<Plus />}
						title={t("configuration_page.start_btn")}
						hint={t("configuration_page.start_hint")}
						action={t("onboarding.new_action")}
						onClick={() => {
							restart();
							handleStart();
						}}
					/>
					<ActionCard
						icon={<ClipboardPaste />}
						title={t("configuration_page.import_clipboard_btn")}
						hint={t("configuration_page.import_clipboard_hint")}
						onClick={() => {
							restart();
							handleImportFromClipboard();
						}}
					/>
					<ActionCard
						icon={<FileUp />}
						title={t("configuration_page.import_file_btn")}
						hint={t("configuration_page.import_file_hint")}
						onClick={() => {
							restart();
							handleImportFromFile();
						}}
					/>
				</div>
			</CenteredPanel>
		);
	}

	if (isFinished) {
		return (
			<CenteredPanel
				icon={<Check />}
				title={t("configuration_page.completed_title")}
				description={t("configuration_page.completed_desc")}
			>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<ActionCard
						primary
						icon={<Calculator />}
						title={t("configuration_page.apply_btn")}
						hint={t("configuration_page.apply_hint")}
						onClick={handleApplyToCalculator}
						className="min-h-[150px]"
					/>
					<ActionCard
						icon={<Save />}
						title={t("configuration_page.export_btn")}
						hint={t("configuration_page.export_hint")}
						onClick={handleExport}
						className="min-h-[150px]"
					/>
					<ActionCard
						icon={<ClipboardCopy />}
						title={t("configuration_page.copy_code_btn")}
						hint={t("configuration_page.copy_code_hint")}
						onClick={handleCopyEncodedConfig}
						className="min-h-[150px]"
					/>
				</div>
				{savedPath && isTauri && (
					<Button
						variant="outline"
						size="sm"
						className="self-start"
						onClick={handleOpenFolder}
					>
						<FolderOpen />
						{t("configuration_page.open_folder_btn")}
					</Button>
				)}
			</CenteredPanel>
		);
	}

	return (
		<Card className="h-full w-full flex-row gap-0 overflow-hidden py-0">
			{!isMobile && (
				<aside className="flex w-[232px] shrink-0 flex-col gap-3 border-r p-5">
					<span className={sectionLabelClass}>
						{t("breadcrumb.new_config")}
					</span>
					<StepList
						steps={steps}
						current={current}
						reached={reached}
						onSelect={jumpTo}
					/>
					<div className="flex-1" />
					<ConfirmDialog
						destructive
						title={t("configuration_page.reset_dialog_title")}
						description={t("configuration_page.reset_dialog_desc")}
						onConfirm={() => {
							handleReset();
							restart();
						}}
						trigger={
							<button
								type="button"
								className="flex items-center gap-1.5 self-start text-[13px] text-muted-foreground hover:text-destructive"
							>
								<RotateCcw className="size-3.5" />
								{t("configuration_page.reset_btn")}
							</button>
						}
					/>
				</aside>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex flex-col gap-1 px-8 pt-6 pb-5">
					<span className={sectionLabelClass}>
						{t("configuration_page.step_counter", {
							current: Math.min(current, count),
							count,
						})}
					</span>
					<h1 className="text-xl font-semibold tracking-tight">{step.title}</h1>
					<p className="text-sm text-muted-foreground">{step.description}</p>
				</header>

				<ScrollArea className="min-h-0 flex-1">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={step.id}
							initial={{ opacity: 0, x: 12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
							className="px-8 pb-6"
						>
							{step.body}
						</motion.div>
					</AnimatePresence>
				</ScrollArea>

				<footer className="flex items-center gap-2 border-t px-8 py-3">
					<Button
						variant="outline"
						onClick={() => setCurrent((value) => Math.max(1, value - 1))}
						disabled={current === 1}
					>
						<ChevronLeft />
						{t("configuration_page.previous_btn")}
					</Button>
					{isMobile && (
						<ConfirmDialog
							destructive
							title={t("configuration_page.reset_dialog_title")}
							description={t("configuration_page.reset_dialog_desc")}
							onConfirm={() => {
								handleReset();
								restart();
							}}
							trigger={
								<Button
									variant="ghost"
									size="icon"
									aria-label={t("configuration_page.reset_btn")}
								>
									<RotateCcw />
								</Button>
							}
						/>
					)}
					<div className="flex-1" />
					{current === bitStep && (
						<ConfirmDialog
							title={t("configuration_page.skip_warning_title")}
							description={t("configuration_page.skip_warning_desc")}
							onConfirm={() => {
								handleSkipBitConfiguration();
								goNext();
							}}
							trigger={
								<Button variant="ghost">
									{t("configuration_page.skip_btn")}
								</Button>
							}
						/>
					)}
					{current >= count ? (
						<Button onClick={handleFinish}>
							{t("configuration_page.finish_btn")}
						</Button>
					) : (
						<Button
							onClick={() => {
								if (validateStep(current)) goNext();
							}}
						>
							{t("configuration_page.next_btn")}
							<ChevronRight />
						</Button>
					)}
				</footer>
			</div>
		</Card>
	);
}
