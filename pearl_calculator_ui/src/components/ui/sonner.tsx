import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useThemePreference } from "@/context/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Toaster = ({ ...props }: ToasterProps) => {
	const { preference } = useThemePreference();
	const isMobile = useIsMobile();

	return (
		<Sonner
			theme={preference}
			className="toaster group"
			position={isMobile ? "top-center" : "bottom-right"}
			duration={isMobile ? 2500 : 4000}
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
