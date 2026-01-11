import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

type MobileView = "input" | "results";

interface MobileViewContextType {
	mobileView: MobileView;
	showResults: () => void;
	showInput: () => void;
	isMobile: boolean;
}

const MobileViewContext = createContext<MobileViewContextType | undefined>(
	undefined,
);

const MOBILE_BREAKPOINT = 768;

export function MobileViewProvider({ children }: { children: ReactNode }) {
	const [mobileView, setMobileView] = useState<MobileView>("input");
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		if (!isMobile) {
			setMobileView("input");
		}
	}, [isMobile]);

	const showResults = useCallback(() => setMobileView("results"), []);
	const showInput = useCallback(() => setMobileView("input"), []);

	const value = useMemo(
		() => ({
			mobileView,
			showResults,
			showInput,
			isMobile,
		}),
		[mobileView, showResults, showInput, isMobile],
	);

	return (
		<MobileViewContext.Provider value={value}>
			{children}
		</MobileViewContext.Provider>
	);
}

export function useMobileView() {
	const context = useContext(MobileViewContext);
	if (!context) {
		throw new Error("useMobileView must be used within a MobileViewProvider");
	}
	return context;
}

export function useMobileViewOptional() {
	return useContext(MobileViewContext);
}
