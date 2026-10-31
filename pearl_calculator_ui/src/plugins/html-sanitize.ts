const ALLOWED_TAGS = new Set(
	[
		"a abbr article aside b bdi bdo blockquote br caption center cite code col",
		"colgroup dd del details dfn div dl dt em figcaption figure font footer h1",
		"h2 h3 h4 h5 h6 header hr i img ins kbd li main mark nav ol p pre q s samp",
		"section small span strong style sub summary sup table tbody td tfoot th",
		"thead time tr u ul var wbr",
		"svg g path line rect circle ellipse polyline polygon text tspan defs",
		"lineargradient radialgradient stop title desc clippath mask pattern marker",
		"symbol",
	]
		.join(" ")
		.split(" "),
);
const BLOCKED_ATTRIBUTE =
	/^(on|href$|xlink:href$|src$|srcset$|action$|formaction$|ping$|background$|poster$|data$|http-equiv$|content$|rel$|target$)/i;
const IMAGE_SOURCE =
	/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[a-z\d+/=]+$/i;

function clean(element: Element) {
	for (const child of Array.from(element.children)) {
		if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
			child.remove();
			continue;
		}
		for (const attribute of Array.from(child.attributes)) {
			const keep =
				!BLOCKED_ATTRIBUTE.test(attribute.name) ||
				(child.tagName.toLowerCase() === "img" &&
					attribute.name.toLowerCase() === "src" &&
					IMAGE_SOURCE.test(attribute.value));
			if (!keep) child.removeAttribute(attribute.name);
		}
		clean(child);
	}
}

export function sanitizeStaticHtml(html: string) {
	const document = new DOMParser().parseFromString(html, "text/html");
	clean(document.head);
	clean(document.body);
	const styles = Array.from(document.head.querySelectorAll("style"))
		.map((style) => style.outerHTML)
		.join("");
	return styles + document.body.innerHTML;
}
