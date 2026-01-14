import {
	Calculator,
	ChevronLeft,
	ChevronRight,
	ClipboardCopy,
	FilePlus,
	FolderOpen,
	OctagonAlert,
	Save,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { OnboardingPanel } from "@/components/common/OnboardingPanel";
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
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfigurationState } from "@/context/ConfigurationStateContext";
import { useConfigurationController } from "@/hooks/use-configuration-controller";
import { isTauri } from "@/services";

export default function Configuration() {
	const [api, setApi] = React.useState<CarouselApi>();
	const [current, setCurrent] = React.useState(0);
	const [count, setCount] = React.useState(0);
	const { t } = useTranslation();
	const { wizardMode } = useConfigurationState();
	const isVector3D = wizardMode === "Vector3D";
	const isAccumulation = wizardMode === "Accumulation";

	const {
		isConfiguring,
		isFinished,
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
	} = useConfigurationController();

	React.useEffect(() => {
		if (!api) {
			return;
		}

		const updateCount = () => {
			setCount(api.scrollSnapList().length);
		};

		updateCount();

		if (shouldRestoreLastPage) {
			const total = api.scrollSnapList().length;
			api.scrollTo(total - 1, true);
			setCurrent(total);
			setShouldRestoreLastPage(false);
		} else {
			setCurrent(api.selectedScrollSnap() + 1);
		}

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});

		api.on("reInit", () => {
			updateCount();
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api, shouldRestoreLastPage, setShouldRestoreLastPage]);

	const progress = count > 0 ? (current / count) * 100 : 0;

	const handleForceNext = () => {
		if (validateStep(current)) {
			api?.scrollNext();
			setTimeout(() => {
				const nextInput = document.getElementById("tnt-config-start-input");
				nextInput?.focus();
			}, 300);
		}
	};

	if (!isConfiguring) {
		return (
			<OnboardingPanel
				icon={<FilePlus />}
				title={t("configuration_page.title")}
				description={t("configuration_page.description")}
			>
				<div className="flex flex-col gap-2 w-48">
					<Button className="w-full" onClick={handleStart}>
						{t("configuration_page.start_btn")}
					</Button>
					<Button
						variant="outline"
						className="w-full"
						onClick={handleImportFromClipboard}
					>
						{t("configuration_page.import_clipboard_btn")}
					</Button>
					<Button
						variant="outline"
						className="w-full"
						onClick={handleImportFromFile}
					>
						{t("configuration_page.import_file_btn")}
					</Button>
				</div>
			</OnboardingPanel>
		);
	}

	if (isFinished) {
		return (
			<OnboardingPanel
				icon={<Save />}
				title={t("configuration_page.completed_title")}
				description={t("configuration_page.completed_desc")}
			>
				<div className="flex flex-col gap-2 w-48">
					<Button className="w-full gap-2" onClick={handleExport}>
						<Save className="h-4 w-4" />
						{t("configuration_page.export_btn")}
					</Button>
					{savedPath && isTauri && (
						<Button
							variant="outline"
							className="w-full gap-2"
							onClick={handleOpenFolder}
						>
							<FolderOpen className="h-4 w-4" />
							{t("configuration_page.open_folder_btn")}
						</Button>
					)}
					<Button
						variant="outline"
						className="w-full gap-2"
						onClick={handleCopyEncodedConfig}
					>
						<ClipboardCopy className="h-4 w-4" />
						{t("configuration_page.copy_code_btn")}
					</Button>
					<Button
						variant="outline"
						className="w-full gap-2"
						onClick={handleApplyToCalculator}
					>
						<Calculator className="h-4 w-4" />
						{t("configuration_page.apply_btn")}
					</Button>
				</div>
			</OnboardingPanel>
		);
	}

	return (
		<div className="h-full w-full overflow-hidden">
			<AnimatePresence mode="wait">
				<motion.div
					key="carousel"
					initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.25, ease: "easeOut" }}
					className="h-full w-full flex flex-col gap-4 p-4"
				>
					<Carousel
						setApi={setApi}
						className="w-full h-full flex flex-col"
						opts={{ watchDrag: false }}
					>
						<CarouselContent className="h-full">
							<CarouselItem className="h-full">
								<ScrollArea className="h-full">
									<CannonTypeStep />
								</ScrollArea>
							</CarouselItem>
							<CarouselItem className="h-full">
								<ScrollArea className="h-full">
									<BasicInfoStep
										errors={errors}
										onForceNext={handleForceNext}
									/>
								</ScrollArea>
							</CarouselItem>
							<CarouselItem className="h-full">
								<ScrollArea className="h-full" orientation="both">
									<TNTConfigurationStep errors={errors} />
								</ScrollArea>
							</CarouselItem>
							{isVector3D && (
								<CarouselItem className="h-full">
									<ScrollArea className="h-full">
										<VerticalTNTStep errors={errors} />
									</ScrollArea>
								</CarouselItem>
							)}
							<CarouselItem className="h-full">
								<ScrollArea className="h-full">
									<BitConfigurationStep errors={errors} />
								</ScrollArea>
							</CarouselItem>
							{isAccumulation && (
								<CarouselItem className="h-full">
									<ScrollArea className="h-full">
										<MultiplierConfigurationStep errors={errors} />
									</ScrollArea>
								</CarouselItem>
							)}
							<CarouselItem className="h-full">
								<ScrollArea className="h-full">
									<PreviewStep />
								</ScrollArea>
							</CarouselItem>
						</CarouselContent>
						<div className="relative flex items-center justify-between gap-2 mt-4 px-1">
							<div className="flex items-center gap-2 shrink-0">
								<Button
									variant="outline"
									onClick={() => api?.scrollPrev()}
									disabled={!api?.canScrollPrev()}
								>
									<ChevronLeft className="h-4 w-4" />
									{t("configuration_page.previous_btn")}
								</Button>
								{current === 1 && (
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="destructive">
												{t("configuration_page.reset_btn")}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader className="items-center">
												<AlertDialogTitle>
													<div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
														<OctagonAlert className="h-7 w-7 text-destructive" />
													</div>
													{t("configuration_page.reset_dialog_title")}
												</AlertDialogTitle>
												<AlertDialogDescription className="text-[15px] text-center">
													{t("configuration_page.reset_dialog_desc")}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter className="mt-2 sm:justify-center">
												<AlertDialogCancel>
													{t("configuration_page.cancel_btn")}
												</AlertDialogCancel>
												<AlertDialogAction
													className={buttonVariants({ variant: "destructive" })}
													onClick={handleReset}
												>
													{t("configuration_page.continue_btn")}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
							<div className="absolute left-1/2 -translate-x-1/2 -top-1 -translate-y-full sm:top-auto sm:translate-y-0 w-24 sm:w-40 pointer-events-none">
								<Progress value={progress} className="w-full" />
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{current === count ? (
									<Button onClick={handleFinish}>
										{t("configuration_page.finish_btn")}
									</Button>
								) : (
									<div className="flex items-center gap-2">
										{current === (isVector3D ? 5 : 4) && (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant="outline">
														{t("configuration_page.skip_btn")}
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															{t("configuration_page.skip_warning_title")}
														</AlertDialogTitle>
														<AlertDialogDescription>
															{t("configuration_page.skip_warning_desc")}
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															{t("configuration_page.cancel_btn")}
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => {
																handleSkipBitConfiguration();
																api?.scrollNext();
															}}
														>
															{t("configuration_page.continue_btn")}
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
										<Button
											onClick={() => {
												if (validateStep(current)) {
													api?.scrollNext();
												}
											}}
											disabled={!api?.canScrollNext()}
										>
											{t("configuration_page.next_btn")}
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								)}
							</div>
						</div>
					</Carousel>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
