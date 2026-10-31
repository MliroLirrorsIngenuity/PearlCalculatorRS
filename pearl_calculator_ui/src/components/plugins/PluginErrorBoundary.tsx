import { TriangleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
	label: string;
	onError?: (message: string) => void;
	children: ReactNode;
}

export class PluginErrorBoundary extends Component<
	Props,
	{ message: string | null }
> {
	state = { message: null as string | null };

	static getDerivedStateFromError(error: unknown) {
		return { message: error instanceof Error ? error.message : String(error) };
	}

	componentDidCatch(error: unknown) {
		this.props.onError?.(
			error instanceof Error ? error.message : String(error),
		);
	}

	render() {
		if (this.state.message === null) return this.props.children;
		return (
			<div className="flex gap-2 rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
				<TriangleAlert className="mt-px size-3.5 shrink-0" />
				<span className="min-w-0 break-words">
					{this.props.label}: {this.state.message}
				</span>
			</div>
		);
	}
}
