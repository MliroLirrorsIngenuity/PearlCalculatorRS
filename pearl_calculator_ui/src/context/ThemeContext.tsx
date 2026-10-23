import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

const CYCLE: ThemePreference[] = ["system", "light", "dark"];

interface ThemeContextValue {
	preference: ThemePreference;
	cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [preference, setPreference] = useState<ThemePreference>("system");

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const apply = () =>
			document.documentElement.classList.toggle(
				"dark",
				preference === "dark" || (preference === "system" && media.matches),
			);
		apply();
		media.addEventListener("change", apply);
		return () => media.removeEventListener("change", apply);
	}, [preference]);

	const value = useMemo(
		() => ({
			preference,
			cyclePreference: () =>
				setPreference(
					(current) => CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length],
				),
		}),
		[preference],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useThemePreference() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useThemePreference must be used within a ThemeProvider");
	}
	return context;
}
