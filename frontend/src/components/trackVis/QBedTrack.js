import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { scaleLinear, scaleLog } from "d3-scale";
import memoizeOne from "memoize-one";
import { notify } from "react-notify-toast";
import Track from "./commonComponents/Track";
import TrackLegend from "./commonComponents/TrackLegend";
import GenomicCoordinates from "./commonComponents/GenomicCoordinates";
import HoverTooltipContext from "./commonComponents/tooltip/HoverTooltipContext";
import { RenderTypes, DesignRenderer } from "../../art/DesignRenderer";
import { ScaleChoices } from "../../model/ScaleChoices";
import { LogChoices } from "../../model/LogChoices";
import { DownsamplingChoices } from "../../model/DownsamplingChoices";
import { FeatureAggregator } from "../../model/FeatureAggregator";

export const DEFAULT_OPTIONS = {
    height: 40,
    color: "blue",
    color2: "red",
    yScale: ScaleChoices.AUTO,
    logScale: LogChoices.AUTO,
    show: "all",
    sampleSize: 1000,
    opacity: [100],
    yMax: 10,
    yMin: 0,
    markerSize: 3,
    showHorizontalLine: false,
    horizontalLineValue: 1,
};

const TOP_PADDING = 5;

/**
 * Track specialized in showing qBED data.
 *
 * @author Silas Hsu, Daofeng Li, and Arnav Moudgil
 */
class QBedTrack extends React.PureComponent {
    static propTypes = Object.assign({}, Track.propsFromTrackContainer, {
        data: PropTypes.array.isRequired, // PropTypes.arrayOf(QBed)
        options: PropTypes.shape({
            height: PropTypes.number.isRequired, // Height of the track
            color: PropTypes.string, // Color to draw circle
            scaleType: PropTypes.any, // Unused for now
            scaleRange: PropTypes.array, // Unused for now
            logScale: PropTypes.string, // For log-scaling y-axis
            opacity: PropTypes.array, // For track opacity
            show: PropTypes.string, // For downsampling
        }).isRequired,
        isLoading: PropTypes.bool, // If true, applies loading styling
        error: PropTypes.any, // If present, applies error styling
    });

    constructor(props) {
        super(props);
        this.xToValue = null;
        this.scales = null;
        // this.computeScales = memoizeOne(this.computeScales); // for some reason computeScales doesn't work when memoized
        this.aggregateFeatures = memoizeOne(this.aggregateFeatures);
        this.renderTooltip = this.renderTooltip.bind(this);
    }

    aggregateFeatures(data, viewRegion, width) {
        const aggregator = new FeatureAggregator();
        const xToFeatures = aggregator.makeXMap(data, viewRegion, width, true);
        return xToFeatures;
    }

    computeScales(xToValue, height) {
        const { yScale, yMin, yMax, logScale } = this.props.options;
        if (yMin > yMax) {
            notify.show("Y-axis min must less than max", "error", 2000);
        }
        const visibleValues = xToValue.slice(this.props.viewWindow.start, this.props.viewWindow.end);
        let max = _.max(_.flatten(visibleValues).map((x) => x.value)) || 0; // in case undefined returned here, cause maxboth be undefined too
        let min = 0;
        if (yScale === ScaleChoices.FIXED) {
            max = yMax ? yMax : max;
            min = yMin ? yMin : min;
        }
        if (min > max) {
            min = max;
        }
        // Define transformation function for log scaling
        let transformer = null;
        switch (logScale) {
            case LogChoices.AUTO:
                transformer = scaleLinear;
                break;
            case LogChoices.BASE10:
                transformer = scaleLog;
                // Set valid minimum value to one;
                // after log-transforming, it will be zero
                min = 1;
                break;
            default:
                notify.show("Invalid logarithm base", "error", 2000);
        }
        return {
            valueToY: transformer().domain([max, min]).range([TOP_PADDING, height]).clamp(true),
            min,
            max,
        };
    }

    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} relativeY - y coordinate of hover relative to the visualizer
     * @param {number} value -
     * @return {JSX.Element} tooltip to render
     */
    renderTooltip(relativeX, relativeY) {
        const { trackModel, viewRegion, width } = this.props;
        const { markerSize } = this.props.options;
        // const radius = height * tooltipRadius;
        let quanta = [];
        // Get nearest QBeds to cursor along x-axis
        for (let i = relativeX - markerSize; i <= relativeX + markerSize; i++) {
            quanta = quanta.concat(this.xToValue[i]);
        }
        // Draw tooltip only if there are values near this x position
        if (quanta !== undefined && quanta.length > 0) {
            // Now find nearest QBeds to the cursor along y-axis
            const nearest = this.nearestCards(quanta, relativeX, relativeY, markerSize);
            if (nearest.length > 0) {
                return (
                    <div>
                        <div className="Tooltip-minor-text">
                            <GenomicCoordinates viewRegion={viewRegion} width={width} x={relativeX} />
                        </div>
                        <div className="Tooltip-minor-text">{trackModel.getDisplayLabel()}</div>
                        <div className="Tooltip-minor-text">{this.formatCards(nearest)}</div>
                    </div>
                );
            }
        }
    }

    formatCards = (quanta) => {
        const head = (
            <thead>
                <tr>
                    <th scope="col">Value</th>
                    <th scope="col">Strand</th>
                    <th scope="col">Annotation</th>
                </tr>
            </thead>
        );
        const rows = quanta.slice(0, 10).map((quantum, i) => (
            <tr key={i}>
                <td>{quantum.value}</td>
                <td>{quantum.strand}</td>
                <td>
                    {_.truncate(quantum.annotation, {
                        length: 75,
                        separator: /[,; ]/,
                    })}
                </td>
            </tr>
        ));
        return (
            <table className="table table-striped table-sm">
                {head}
                <tbody>{rows}</tbody>
            </table>
        );
    };

    // Return closest calling quanta to the cursor
    nearestCards = (quanta, relativeX, relativeY, radius) => {
        const distances = [];
        quanta.forEach((quantum) => {
            if (quantum && quantum.relativeX) {
                distances.push(Math.pow(relativeX - quantum.relativeX, 2) + Math.pow(relativeY - quantum.relativeY, 2));
            }
        });
        // Avoid taking square roots if possible; compare to radius^2
        const mindist = Math.min(...distances);
        if (mindist < radius * radius) {
            const returnCards = [];
            for (let i = 0; i < distances.length; i++) {
                if (Math.abs(distances[i]) === mindist) returnCards.push(quanta[i]);
            }
            return returnCards;
        } else {
            return [];
        }
    };

    /**
     * Shuffles array in place (Fisher-Yates algorithm)
     * @param {Array} a items An array containing the items.
     */
    shuffleArray = (a) => {
        let j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    };

    randomCards = (quanta, n) => {
        return this.shuffleArray(quanta).slice(0, n);
    };

    downSample(xToValue, sampleSize) {
        if (xToValue.length === 0) return [];
        // Initialize return value
        let sampled_xToValue = [];
        sampled_xToValue.length = xToValue.length;
        sampled_xToValue.fill([]);
        // Draw random downsample
        const randomSample = this.randomCards(xToValue.flat(), sampleSize);
        for (let i = 0; i < randomSample.length; i++) {
            const j = randomSample[i].relativeX;
            sampled_xToValue[j] = sampled_xToValue[j].concat([randomSample[i]]);
        }
        return sampled_xToValue;
    }

    render() {
        const { data, viewRegion, width, trackModel, options, forceSvg, viewWindow } = this.props;
        const {
            height,
            color,
            color2,
            markerSize,
            opacity,
            show,
            sampleSize,
            showHorizontalLine,
            horizontalLineValue,
        } = options;
        this.xToValue = data.length > 0 ? this.aggregateFeatures(data, viewRegion, width) : [];
        this.scales = this.computeScales(this.xToValue, height);
        // Set relative coordinates for each QBed (used for tooltip)
        for (let i = 0; i < this.xToValue.length; i++) {
            for (let j = 0; j < this.xToValue[i].length; j++) {
                this.xToValue[i][j].relativeX = i;
                this.xToValue[i][j].relativeY = this.scales.valueToY(this.xToValue[i][j].value);
            }
        }
        // Downsample if necessary
        if (show === DownsamplingChoices.SAMPLE && data.length > sampleSize) {
            // Store original data structure
            this.xToValueOriginal = this.xToValue;
            // Set to the downsampled dataset
            this.xToValue = this.downSample(this.xToValue, sampleSize);
        }
        const legend = <TrackLegend trackModel={trackModel} height={height} axisScale={this.scales.valueToY} />;
        const visualizer = (
            <HoverTooltipContext tooltipRelativeY={height} getTooltipContents={this.renderTooltip} useRelativeY={true}>
                <QBedPlot
                    xToValue={this.xToValue}
                    scales={this.scales}
                    height={height}
                    color={color}
                    color2={color2}
                    forceSvg={forceSvg}
                    markerSize={markerSize}
                    alpha={opacity[0] / 100}
                    show={show}
                    sampleSize={sampleSize}
                    showHorizontalLine={showHorizontalLine}
                    horizontalLineValue={horizontalLineValue}
                    viewWindow={viewWindow}
                />
            </HoverTooltipContext>
        );
        return <Track {...this.props} legend={legend} visualizer={visualizer} />;
    }
}

class QBedPlot extends React.PureComponent {
    static propTypes = {
        xToValue: PropTypes.array.isRequired,
        scales: PropTypes.object.isRequired,
        height: PropTypes.number.isRequired,
        color: PropTypes.string,
        color2: PropTypes.string,
        markerSize: PropTypes.number,
        alpha: PropTypes.number,
        show: PropTypes.string,
        sampleSize: PropTypes.number,
        showHorizontalLine: PropTypes.bool,
        horizontalLineValue: PropTypes.number,
    };

    constructor(props) {
        super(props);
        this.renderPixel = this.renderPixel.bind(this);
    }

    /**
     * Gets an element to draw for a data record.
     *
     * @param {number} value
     * @param {number} x
     * @return {JSX.Element} circle element to render
     */
    renderPixel(value, x) {
        if (value.length === 0) {
            return null;
        }
        const { scales, color, color2, markerSize, alpha } = this.props;
        return value.map((quantum, idx) => {
            const y = scales.valueToY(quantum.value);
            const key = `${x}-${idx}`;
            const colorToUse = quantum.strand === "-" ? color2 : color;
            return (
                <circle key={key} cx={x} cy={y} r={markerSize} fill="none" stroke={colorToUse} strokeOpacity={alpha} />
            );
        });
    }

    renderHorizontalLine = () => {
        const { showHorizontalLine, horizontalLineValue, scales, viewWindow } = this.props;
        if (!showHorizontalLine) {
            return null;
        }
        const y = scales.valueToY(horizontalLineValue);
        return <line stroke="black" strokeWidth={1} x1={viewWindow.start} y1={y} x2={viewWindow.end} y2={y} />;
    };

    render() {
        const { xToValue, height, forceSvg } = this.props;
        return (
            <DesignRenderer
                type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
                width={xToValue.length}
                height={height}
            >
                {xToValue.map(this.renderPixel)}
                {this.renderHorizontalLine()}
            </DesignRenderer>
        );
    }
}

export default QBedTrack;
