import {
	Box,
	Calculator,
	Check,
	ChevronsUpDown,
	Languages,
	PlusSquare,
	Rotate3d,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useConfig } from "@/context/ConfigContext";
import type { PearlVersion } from "@/types/domain";
import { AppInfo } from "./layout/AppInfo";

const items = [
	{
		title: "sidebar.configuration",
		url: "/configuration",
		icon: PlusSquare,
	},
];
const versions: { name: string; value: PearlVersion }[] = [
	{
		name: "1.20.4 & Older",
		value: "Legacy",
	},
	{
		name: "1.20.5 - 1.21.1",
		value: "Post1205",
	},
	{
		name: "1.21.2+",
		value: "Post1212",
	},
];
const languages = [
	{ name: "English", code: "en" },
	{ name: "中文", code: "zh" },
];
export function AppSidebar() {
	const location = useLocation();
	const { t, i18n } = useTranslation();
	const { version, setVersion } = useConfig();
	const { isMobile } = useSidebar();
	const [selectedLanguage, setSelectedLanguage] = useState(
		languages.find((l) => i18n.language.startsWith(l.code)) || languages[0],
	);
	const selectedVersion =
		versions.find((v) => v.value === version) || versions[0];
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup className="pt-0">
					<SidebarGroupLabel className="flex items-center gap-2 px-0 w-fit">
						{t("sidebar.title")}
						<AppInfo className="translate-y-0.25" />
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={location.pathname === "/"}>
									<Link to="/">
										<Calculator />
										<span>{t("sidebar.calculator")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={location.pathname === "/simulator"}
								>
									<Link to="/simulator">
										<Rotate3d />
										<span>{t("sidebar.simulator")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={location.pathname === item.url}
									>
										<Link to={item.url}>
											<item.icon />
											<span>{t(item.title as any)}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-black border border-gray-200">
										<Box className="size-4" />
									</div>
									<div className="flex flex-col gap-0.5 leading-none">
										<span className="">{t("sidebar.version")}</span>
										<span className="font-semibold">
											{selectedVersion.name}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								align="start"
								side={isMobile ? "top" : "right"}
								sideOffset={4}
							>
								<DropdownMenuLabel className="text-xs text-muted-foreground">
									{t("sidebar.version")}
								</DropdownMenuLabel>
								{versions.map((v) => (
									<DropdownMenuItem
										key={v.name}
										onClick={() => setVersion(v.value)}
										className="gap-2 p-2"
									>
										{v.name}
										{v.value === version && <Check className="ml-auto" />}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-black border border-gray-200">
										<Languages className="size-4" />
									</div>
									<div className="flex flex-col gap-0.5 leading-none">
										<span className="">{t("sidebar.language")}</span>
										<span className="font-semibold">
											{selectedLanguage.name}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								align="start"
								side={isMobile ? "top" : "right"}
								sideOffset={4}
							>
								<DropdownMenuLabel className="text-xs text-muted-foreground">
									{t("sidebar.language")}
								</DropdownMenuLabel>
								{languages.map((language) => (
									<DropdownMenuItem
										key={language.code}
										onClick={() => {
											setSelectedLanguage(language);
											i18n.changeLanguage(language.code);
										}}
										className="gap-2 p-2"
									>
										{language.name}
										{language.code === selectedLanguage.code && (
											<Check className="ml-auto" />
										)}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
