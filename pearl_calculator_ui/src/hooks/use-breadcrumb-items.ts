import { match } from "ts-pattern";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCalculatorState } from "@/context/CalculatorStateContext";
import { useConfig } from "@/context/ConfigContext";
import { useConfigurationState } from "@/context/ConfigurationStateContext";

export interface BreadcrumbItemType {
    label: string | undefined;
    href?: string;
    active?: boolean;
    onClick?: () => void;
}


export function useBreadcrumbItems() {
    const location = useLocation();
    const { t } = useTranslation();
    const { hasConfig, setHasConfig } = useConfig();
    const { defaultCalculator, updateDefaultTrace, updateBitCalculation } = useCalculatorState();
    const { isWizardActive, isFinished, setIsFinished, setIsWizardActive } = useConfigurationState();

    const showPearlTrace = defaultCalculator.trace.show;
    const showBitCalculation = defaultCalculator.trace.bitCalculation?.show;

    const resetConfig = () => {
        updateBitCalculation({ show: false });
        updateDefaultTrace({ show: false });
        setHasConfig(false);
    };

    const resetTrace = () => {
        updateBitCalculation({ show: false });
        updateDefaultTrace({ show: false });
    };

    const resetBit = () => updateBitCalculation({ show: false });

    const resetWizard = () => {
        setIsWizardActive(false);
        setIsFinished(false);
    };

    const resetFinished = () => setIsFinished(false);

    const getHomeBreadcrumbs = (): BreadcrumbItemType[] => {
        return match({ hasConfig, showPearlTrace, showBitCalculation })
            .with({ hasConfig: false }, () => [
                { label: t("breadcrumb.select_config"), href: "/", active: true },
            ])
            .with({ showPearlTrace: false }, () => [
                { label: t("breadcrumb.select_config"), onClick: resetConfig },
                { label: t("breadcrumb.calculator"), href: "/", active: true },
            ])
            .with({ showBitCalculation: false }, () => [
                { label: t("breadcrumb.select_config"), onClick: resetConfig },
                { label: t("breadcrumb.calculator"), href: "/", onClick: resetTrace },
                { label: t("breadcrumb.pearl_trace"), active: true },
            ])
            .otherwise(() => [
                { label: t("breadcrumb.select_config"), onClick: resetConfig },
                { label: t("breadcrumb.calculator"), href: "/", onClick: resetTrace },
                { label: t("breadcrumb.pearl_trace"), onClick: resetBit },
                { label: t("breadcrumb.bit_calculation"), active: true },
            ]);
    };

    const getConfigBreadcrumbs = (): BreadcrumbItemType[] => {
        return match({ isWizardActive, isFinished })
            .with({ isWizardActive: false }, () => [
                { label: t("breadcrumb.configuration"), href: "/configuration", active: true },
            ])
            .with({ isFinished: false }, () => [
                { label: t("breadcrumb.configuration"), href: "/configuration", onClick: resetWizard },
                { label: t("breadcrumb.new_config"), active: true },
            ])
            .otherwise(() => [
                { label: t("breadcrumb.configuration"), href: "/configuration", onClick: resetWizard },
                { label: t("breadcrumb.new_config"), onClick: resetFinished },
                { label: t("breadcrumb.completed"), active: true },
            ]);
    };

    return match(location.pathname)
        .with("/", () => getHomeBreadcrumbs())
        .with("/simulator", () => [{ label: t("breadcrumb.simulator"), href: "/simulator", active: true }])
        .with("/configuration", () => getConfigBreadcrumbs())
        .with("/settings", () => [{ label: t("breadcrumb.settings"), href: "/settings", active: true }])
        .otherwise(() => []);
}
