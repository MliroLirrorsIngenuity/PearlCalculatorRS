import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "@/components/layout/Layout";
import { CalculatorStateProvider } from "@/context/CalculatorStateContext";
import { ConfigProvider } from "@/context/ConfigContext";
import { ConfigurationStateProvider } from "@/context/ConfigurationStateContext";
import { useCalculatorSync } from "@/hooks/use-calculator-sync";
import Calculator from "@/pages/Calculator";
import Configuration from "@/pages/Configuration";
import PluginTool from "@/pages/PluginTool";
import Simulator from "@/pages/Simulator";

function App() {
	useEffect(() => {
		if (import.meta.env.DEV) return;
		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === "F12" ||
				(e.ctrlKey && e.key === "r") ||
				(e.ctrlKey && e.key === "R") ||
				e.key === "F5" ||
				(e.ctrlKey && e.key === "p") ||
				(e.ctrlKey && e.key === "P") ||
				(e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I"))
			) {
				e.preventDefault();
			}
		};
		document.addEventListener("contextmenu", handleContextMenu);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
	return (
		<ConfigProvider>
			<CalculatorStateProvider>
				<ConfigurationStateProvider>
					<CalculatorSync />
					<BrowserRouter>
						<Routes>
							<Route path="/" element={<Layout />}>
								<Route index element={<Calculator />} />
								<Route path="simulator" element={<Simulator />} />
								<Route path="configuration" element={<Configuration />} />
								<Route
									path="tools/:pluginId/:toolId"
									element={<PluginTool />}
								/>
							</Route>
						</Routes>
					</BrowserRouter>
				</ConfigurationStateProvider>
			</CalculatorStateProvider>
		</ConfigProvider>
	);
}
function CalculatorSync() {
	useCalculatorSync();
	return null;
}

export default App;
