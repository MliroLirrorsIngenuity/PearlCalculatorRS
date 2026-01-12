import * as React from "react";

const MOBILE_BREAKPOINT = 768;
export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
		undefined,
	);
	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
		
		const checkMobile = () => {
			// check device is touch or small screen
			const isTouchDevice = touchQuery.matches;
			const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
			setIsMobile(isTouchDevice || isSmallScreen);
		};
		
		checkMobile();
		mql.addEventListener("change", checkMobile);
		touchQuery.addEventListener("change", checkMobile);
		window.addEventListener("orientationchange", checkMobile);
		
		return () => {
			mql.removeEventListener("change", checkMobile);
			touchQuery.removeEventListener("change", checkMobile);
			window.removeEventListener("orientationchange", checkMobile);
		};
	}, []);
	return !!isMobile;
}
