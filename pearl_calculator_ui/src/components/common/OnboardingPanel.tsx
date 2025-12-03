import { AnimatePresence, motion } from "motion/react";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

interface OnboardingPanelProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	children: React.ReactNode;
}

export function OnboardingPanel({
	icon,
	title,
	description,
	children,
}: OnboardingPanelProps) {
	return (
		<div className="h-full w-full overflow-hidden">
			<AnimatePresence mode="wait">
				<motion.div
					key="empty"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
					transition={{ duration: 0.1, ease: "easeInOut" }}
					className="flex h-full w-full items-center justify-center"
				>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<motion.div
									initial={{ rotate: -10, scale: 0.9 }}
									animate={{ rotate: 0, scale: 1 }}
									transition={{
										type: "spring",
										stiffness: 260,
										damping: 20,
										delay: 0.1,
									}}
								>
									{icon}
								</motion.div>
							</EmptyMedia>
							<EmptyTitle>{title}</EmptyTitle>
							<EmptyDescription>{description}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>{children}</EmptyContent>
					</Empty>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
