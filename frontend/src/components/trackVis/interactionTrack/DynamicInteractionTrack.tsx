import React from "react";
import _ from "lodash";
// import memoizeOne from "memoize-one";
import { scaleLinear } from "d3-scale";
import { notify } from "react-notify-toast";

import { PixiHeatmap } from "./PixiHeatmap";
import { PixiArc } from "./PixiArc";

import Track, { PropsFromTrackContainer } from "../commonComponents/Track";
import TrackLegend from "../commonComponents/TrackLegend";
import configOptionMerging from "../commonComponents/configOptionMerging";
import { withTooltip, TooltipCallbacks } from "../commonComponents/tooltip/withTooltip";
import Tooltip from "../commonComponents/tooltip/Tooltip";

import { FeaturePlacer } from "../../../model/FeaturePlacer";
import { GenomeInteraction } from "../../../model/GenomeInteraction";
import { ScaleChoices } from "../../../model/ScaleChoices";
import { DynamicInteractionDisplayMode } from "../../../model/DisplayModes";

interface DynamicInteractionTrackProps extends PropsFromTrackContainer, TooltipCallbacks {
    data: GenomeInteraction[][];
    options: {
        color: string;
        color2?: string;
        backgroundColor?: string;
        binSize?: number;
        scoreScale?: string;
        scoreMax?: number;
        scoreMin?: number;
        height: number;
        playing?: boolean;
        speed?: number[];
        lineWidth?: number;
        displayMode: DynamicInteractionDisplayMode;
        dynamicColors?: any[];
        useDynamicColors?: boolean;
    };
    viewer3dNumFrames?: any;
}

export const DEFAULT_OPTIONS = {
    color: "#B8008A",
    color2: "#006385",
    backgroundColor: "white",
    scoreScale: ScaleChoices.AUTO,
    scoreMax: 10,
    scoreMin: 0,
    height: 500,
    playing: true,
    speed: [5],
    lineWidth: 1,
    useDynamicColors: false,
    dynamicColors: [] as any[],
    displayMode: DynamicInteractionDisplayMode.HEATMAP,
};
const withDefaultOptions = configOptionMerging(DEFAULT_OPTIONS);

class DynamicInteractionTrack extends React.PureComponent<DynamicInteractionTrackProps, {}> {
    public featurePlacer: FeaturePlacer;

    scales: any;

    constructor(props: DynamicInteractionTrackProps) {
        super(props);
        this.scales = null;
        this.featurePlacer = new FeaturePlacer();
        // this.featurePlacer.placeInteractions = memoizeOne(this.featurePlacer.placeInteractions);
        // this.computeScale = memoizeOne(this.computeScale);
        this.showTooltip = this.showTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);
    }

    computeScale = () => {
        const { scoreScale, scoreMin, scoreMax } = this.props.options;
        const maxValues = this.props.data.map((d) => {
            const maxObj = _.maxBy(d, "score");
            return maxObj ? maxObj.score : 1;
        });
        const maxScore = _.max(maxValues);
        if (scoreScale === ScaleChoices.AUTO) {
            return {
                opacityScale: scaleLinear().domain([0, maxScore]).range([0, 1]).clamp(true),
                min: 0,
                max: maxScore,
            };
        } else {
            if (scoreMin >= scoreMax) {
                notify.show("Score min cannot be greater than Score max", "error", 2000);
                return {
                    opacityScale: scaleLinear()
                        .domain([scoreMax - 1, scoreMax])
                        .range([0, 1])
                        .clamp(true),
                    min: scoreMax - 1,
                    max: scoreMax,
                };
            }
            return {
                opacityScale: scaleLinear().domain([scoreMin, scoreMax]).range([0, 1]).clamp(true),
                min: scoreMin,
                max: scoreMax,
            };
        }
    };

    showTooltip(event: React.MouseEvent, interaction: GenomeInteraction) {
        const tooltip = (
            <Tooltip pageX={event.pageX} pageY={event.pageY} ignoreMouse={true}>
                <div>
                    <div>Locus1: {interaction.locus1.toString()}</div>
                    <div>Locus2: {interaction.locus2.toString()}</div>
                    <div>Score: {interaction.score}</div>
                </div>
            </Tooltip>
        );
        this.props.onShowTooltip(tooltip);
    }

    hideTooltip() {
        this.props.onHideTooltip();
    }

    render(): JSX.Element {
        const { data, trackModel, visRegion, width, viewWindow, options, viewer3dNumFrames } = this.props;
        this.scales = this.computeScale();
        const visualizerProps = {
            placedInteractionsArray: data.map((d) => this.featurePlacer.placeInteractions(d, visRegion, width)),
            viewWindow,
            width,
            height: options.height,
            opacityScale: this.scales.opacityScale,
            color: options.color,
            color2: options.color2,
            backgroundColor: options.backgroundColor,
            binSize: options.binSize,
            onInteractionHovered: this.showTooltip,
            onMouseOut: this.hideTooltip,
            playing: options.playing,
            speed: options.speed,
            trackModel,
            lineWidth: options.lineWidth,
            dynamicColors: options.dynamicColors,
            useDynamicColors: options.useDynamicColors,
            viewer3dNumFrames,
        };
        let visualizer;
        if (options.displayMode === DynamicInteractionDisplayMode.ARC) {
            visualizer = <PixiArc {...visualizerProps} />;
        } else {
            visualizer = <PixiHeatmap {...visualizerProps} />;
        }

        return (
            <Track
                {...this.props}
                legend={<TrackLegend trackModel={trackModel} height={options.height} />}
                // legend={<TrackLegend trackModel={trackModel} height={50} />}
                visualizer={visualizer}
            />
        );
    }
}

export default withDefaultOptions(withTooltip(DynamicInteractionTrack as any));
