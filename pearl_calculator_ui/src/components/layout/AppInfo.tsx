import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BadgeInfo, Github } from "lucide-react";
import pkg from "../../../package.json";
import tauriConf from "../../../src-tauri/tauri.conf.json";

export function AppInfo({ className }: { className?: string }) {
	return (
		<div
			className={className}
			style={{
				paddingTop: "env(safe-area-inset-top)",
				paddingBottom: "env(safe-area-inset-bottom)",
				paddingLeft: "env(safe-area-inset-left)",
				paddingRight: "env(safe-area-inset-right)",
			}}
		>
			<HoverCard openDelay={0} closeDelay={0}>
				<HoverCardTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-4 w-4 rounded-full text-muted-foreground hover:text-foreground"
					>
						<BadgeInfo className="h-3.5 w-3.5" />
					</Button>
				</HoverCardTrigger>
				<HoverCardContent
					className="w-80 p-4 pb-2 rounded-xl select-none"
					align="start"
					side="right"
				>
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<h4 className="font-bold text-base leading-none tracking-tight">
								{tauriConf.productName}
							</h4>
							<div className="flex items-center gap-1.5">
								<Badge
									variant="secondary"
									className="text-[10px] px-1.5 h-4.5 font-normal rounded-md"
								>
									v{pkg.version}
								</Badge>
								<Badge
									variant="outline"
									className="text-[10px] px-1.5 h-4.5 font-normal rounded-md"
								>
									MIT
								</Badge>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
								Developed By
							</span>
							<div className="text-xs text-foreground font-medium">
								MliroLirrorsIngenuity, Lemon_miaow, FLYEMOJI
							</div>
							<span className="text-[10px] text-muted-foreground">
								& Open Source Contributors
							</span>
						</div>

						<div className="pt-2 flex items-center justify-between border-t border-border/50 mt-1">
							<span className="text-[10px] text-muted-foreground">
								Copyright © 2025 MliroLirrorsIngenuity
							</span>
							<div className="flex items-center gap-1">
								{pkg.repository?.url && (
									<>
										<a
											href={pkg.repository.url}
											target="_blank"
											rel="noreferrer"
											title="GitHub Repository"
										>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
											>
												<Github className="h-4 w-4" />
											</Button>
										</a>
									</>
								)}
							</div>
						</div>
					</div>
				</HoverCardContent>
			</HoverCard>
		</div>
	);
}
