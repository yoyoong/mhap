import React from "react";
import SelectConfig from "./SelectConfig";
import {
    AnnotationDisplayModes,
    NumericalDisplayModes,
    InteractionDisplayMode,
    DynamicInteractionDisplayMode,
    BigWigZoomLevels,
    VcfColorScaleKeys,
    VcfDisplayModes,
} from "../../model/DisplayModes";

/**
 * A menu item for configuring display modes of annotation tracks.
 *
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} element to render
 */
export function AnnotationDisplayModeConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="displayMode"
            label="Display mode:"
            defaultValue={AnnotationDisplayModes.FULL}
            choices={AnnotationDisplayModes}
        />
    );
}

/**
 * A menu item for configuring display modes of numerical tracks.
 *
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} element to render
 */
export function NumericalDisplayModeConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="displayMode"
            label="Display mode:"
            defaultValue={NumericalDisplayModes.AUTO}
            choices={NumericalDisplayModes}
        />
    );
}

export function InteractionDisplayModeConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="displayMode"
            label="Display mode:"
            defaultValue={InteractionDisplayMode.HEATMAP}
            choices={InteractionDisplayMode}
        />
    );
}

export function DynamicInteractionDisplayModeConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="displayMode"
            label="Display mode:"
            defaultValue={DynamicInteractionDisplayMode.HEATMAP}
            choices={DynamicInteractionDisplayMode}
        />
    );
}

export function BigWigZoomLevelConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="zoomLevel"
            label="Zoom level:"
            defaultValue={BigWigZoomLevels.AUTO}
            choices={BigWigZoomLevels}
        />
    );
}

export function VcfColorScaleKeyConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="colorScaleKey"
            label="Color variant by:"
            defaultValue={VcfColorScaleKeys.AF}
            choices={VcfColorScaleKeys}
        />
    );
}

export function VcfDisplayModeConfig(props) {
    return (
        <SelectConfig
            {...props}
            optionName="displayMode"
            label="Display mode:"
            defaultValue={VcfDisplayModes.AUTO}
            choices={VcfDisplayModes}
        />
    );
}
