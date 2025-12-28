import { useEffect, useRef, useState } from "react";

export function useElementSize<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const [size, setSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const updateSize = () => {
			setSize({
				width: element.offsetWidth,
				height: element.offsetHeight,
			});
		};

		updateSize();

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setSize({
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				});
			}
		});

		resizeObserver.observe(element);

		return () => resizeObserver.disconnect();
	}, []);

	return { ref, width: size.width, height: size.height };
}
