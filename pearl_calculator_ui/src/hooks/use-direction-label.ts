import { useTranslation } from "react-i18next";

export function useDirectionLabel() {
    const { t } = useTranslation();

    const getCardinalLabel = (dir: string): string => {
        const directionMap: Record<string, string> = {
            North: t("calculator.direction_north"),
            South: t("calculator.direction_south"),
            East: t("calculator.direction_east"),
            West: t("calculator.direction_west"),
        };
        return directionMap[dir] || dir;
    };

    const getCompoundLabel = (dir: string): string => {
        const directionMap: Record<string, string> = {
            NE: t("calculator.direction_badge_ne"),
            NW: t("calculator.direction_badge_nw"),
            SE: t("calculator.direction_badge_se"),
            SW: t("calculator.direction_badge_sw"),
        };
        return directionMap[dir] || dir;
    };

    return { getCardinalLabel, getCompoundLabel };
}
