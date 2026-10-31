import {
	forwardRef,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { landingIndex } from "@/components/charts/trajectory";
import { Segmented } from "@/components/common/Metric";
import { useElementSize } from "@/hooks/use-element-size";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { cn } from "@/lib/utils";
import { copyText } from "@/plugins/copy";
import { calculatorService } from "@/services";
import type { PearlTraceResult } from "@/types/domain";

export interface TraceDataPanelRef {
	scrollToRow: (rowIndex: number) => void;
}

interface TraceDataPanelProps {
	data: PearlTraceResult | null;
}

type View = "trajectory" | "momentum";

const ROW_HEIGHT = 29;
const OVERSCAN = 8;
const gridClass =
	"grid grid-cols-[40px_repeat(3,minmax(0,1fr))] gap-x-2 px-3.5 [&>span]:truncate";

const TraceDataPanel = forwardRef<TraceDataPanelRef, TraceDataPanelProps>(
	function TraceDataPanel({ data }, ref) {
		const { t } = useTranslation();
		const { showSuccess, showError } = useToastNotifications();
		const [view, setView] = useState<View>("trajectory");
		const [scrollTop, setScrollTop] = useState(0);
		const [flashRow, setFlashRow] = useState<number | null>(null);
		const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
		const { ref: viewportRef, height } = useElementSize<HTMLDivElement>();

		const points = useMemo(() => {
			if (!data) return [];
			return view === "trajectory"
				? data.pearl_trace
				: (data.pearl_motion_trace ?? []);
		}, [data, view]);
		const landing = data ? landingIndex(data) : -1;

		useImperativeHandle(ref, () => ({
			scrollToRow: (rowIndex: number) => {
				const viewport = viewportRef.current;
				if (!viewport) return;
				const top = Math.max(
					0,
					rowIndex * ROW_HEIGHT - viewport.clientHeight / 3,
				);
				viewport.scrollTop = top;
				setScrollTop(top);
				setFlashRow(rowIndex);
				clearTimeout(flashTimer.current);
				flashTimer.current = setTimeout(() => setFlashRow(null), 1500);
			},
		}));

		const copyRow = async (
			tick: number,
			point: { X: number; Y: number; Z: number },
		) => {
			const values = [point.X, point.Y, point.Z].map((value) =>
				value.toFixed(10),
			);
			try {
				const text = await copyText("trace", values.join(" "), {
					tick,
					view,
					x: point.X,
					y: point.Y,
					z: point.Z,
				});
				await calculatorService.copyToClipboard(text);
				showSuccess(t(`trace.copied_${view}`, { tick }));
			} catch (error) {
				showError(t("trace.copy_failed"), error);
			}
		};

		const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
		const last = Math.min(
			points.length,
			Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN,
		);
		const headers =
			view === "trajectory"
				? [
						t("calculator.header_x"),
						t("calculator.header_y"),
						t("calculator.header_z"),
					]
				: [
						t("calculator.header_vx"),
						t("calculator.header_vy"),
						t("calculator.header_vz"),
					];

		return (
			<div className="@container flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
				<div className="flex items-center gap-2.5 p-2">
					<Segmented
						className="grid flex-1 grid-cols-2"
						value={view}
						onChange={setView}
						options={[
							{ value: "trajectory", label: t("calculator.tab_trajectory") },
							{ value: "momentum", label: t("calculator.tab_momentum") },
						]}
					/>
					<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
						{t("trace.rows", { count: points.length })}
						<span className="hidden @[22rem]:inline">
							{" · "}
							{t("trace.copy_hint")}
						</span>
					</span>
				</div>
				<div
					ref={viewportRef}
					onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
					className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
				>
					<div
						className={cn(
							gridClass,
							"sticky top-0 z-10 border-y bg-muted/60 py-2 text-right text-xs font-medium text-muted-foreground backdrop-blur",
						)}
					>
						<span className="text-left">{t("calculator.header_tick")}</span>
						{headers.map((header) => (
							<span key={header}>{header}</span>
						))}
					</div>
					<div
						className="relative"
						style={{ height: points.length * ROW_HEIGHT }}
					>
						{points.slice(first, last).map((point, offset) => {
							const tick = first + offset;
							return (
								<button
									type="button"
									key={tick}
									title={t("trace.copy_hint")}
									onClick={() => copyRow(tick, point)}
									className={cn(
										gridClass,
										"absolute inset-x-0 cursor-pointer items-center border-b border-border/50 text-right text-xs tabular-nums transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none",
										tick === landing && "bg-primary/[0.06] font-medium",
										tick === flashRow && "bg-primary/15",
									)}
									style={{ top: tick * ROW_HEIGHT, height: ROW_HEIGHT }}
								>
									<span className="text-left text-muted-foreground">
										{tick}
									</span>
									<span>{point.X.toFixed(10)}</span>
									<span>{point.Y.toFixed(10)}</span>
									<span>{point.Z.toFixed(10)}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		);
	},
);

export default TraceDataPanel;
