import React from 'react';
import PropTypes from 'prop-types';
import { getRelativeCoordinates, niceBpCount } from '../../../util';
import './HorizontalFragment.css';

const LINE_MARGIN = 1; // margin between rough alignment segment and edge of polygon.
const LINE_WIDTH = 2; // line height 2px in css file.
const TRIANGLE_SIZE = 5; // triangle size 5px in css file.
const FONT_SIZE = 10; // current text width.
/**
 * Like a <div> in every way, except it a horizontal line at where the merged alignment segment is.
 * 
 * @author Xiaoyu Zhuo
 */
class HorizontalFragment extends React.Component {
    static propTypes = {
        relativeY: PropTypes.number,
        xSpanList: PropTypes.array,
    };

    constructor(props) {
        super(props);
        this.state = {
            relativeX: null
        };

        this.storeMouseCoordinates = this.storeMouseCoordinates.bind(this);
        this.clearMouseCoordinates = this.clearMouseCoordinates.bind(this);
    }

    /**
     * Stores a mouse event's coordinates in state.
     * 
     * @param {MouseEvent} event - mousemove event whose coordinates to store
     */
    storeMouseCoordinates(event) {
        this.setState({relativeX: getRelativeCoordinates(event).x});
        if (this.props.onMouseMove) {
            this.props.onMouseMove(event);
        }
    }

    /**
     * Clears stored mouse event coordinates.
     * 
     * @param {MouseEvent} event - mouseleave event that triggered this callback
     */
    clearMouseCoordinates(event) {
        this.setState({relativeX: null});
        if (this.props.onMouseLeave) {
            this.props.onMouseLeave(event);
        }
    }

    /**
     * @inheritdoc
     */
    render() {
        const {height, segmentArray, strand, viewWindowStart, primaryColor, queryColor, 
            onMouseMove, onMouseLeave, style, children, rectHeight, ...otherProps} = this.props;
        // calculate xSpanIndex by comparing relativeX with tangetXSpan.
        const relativeX = this.state.relativeX;
        const strandList = segmentArray.map((segment) => segment.record.queryStrand);
        const targetXSpanList = segmentArray.map((segment) => segment.targetXSpan);
        const queryXSpanList = segmentArray.map((segment) => segment.queryXSpan);
        const targetLocusList = segmentArray.map((segment) => segment.visiblePart.getLocus().toString());
        const queryLocusList = segmentArray.map((segment) => segment.visiblePart.getQueryLocus());
        const lengthList = segmentArray.map((segment) => niceBpCount(segment.visiblePart.getLength()));
        const queryLengthList = segmentArray.map((segment) => niceBpCount(segment.visiblePart.getQueryLocus().getLength()));
        const xSpanIndex = targetXSpanList.reduce((iCusor, x, i) => x.start < relativeX && x.end >= relativeX  ? i : iCusor, NaN);
        // const mergedStyle = Object.assign({position: 'relative'}, style);
        var lines;
        if (isNaN(xSpanIndex)) {
            lines = (<React.Fragment>{null}</React.Fragment>);
        }
        else {
            const targetXSpan = targetXSpanList[xSpanIndex];
            const queryXSpan = queryXSpanList[xSpanIndex];
            const targetLocus = targetLocusList[xSpanIndex] + "(" + lengthList[xSpanIndex] + ")";
            const queryLocus = queryLocusList[xSpanIndex] + "(" + queryLengthList[xSpanIndex] + ")";
            //1. The following is not accurate. Should use locus coordinates in alignment segment.
            const queryX = strandList[xSpanIndex] === strand ? 
                            queryXSpan.start + queryXSpan.getLength() * (relativeX - targetXSpan.start) / targetXSpan.getLength():
                            queryXSpan.end - queryXSpan.getLength() * (relativeX - targetXSpan.start) / targetXSpan.getLength();
            lines = (
                <React.Fragment>
                    {<HorizontalLine relativeY={LINE_MARGIN} xSpan={targetXSpan} viewWindowStart={viewWindowStart} color={primaryColor} locus={targetLocus} textHeight={10}/>}
                    {<Triangle relativeX={relativeX - TRIANGLE_SIZE} relativeY={LINE_MARGIN + LINE_WIDTH + rectHeight} color={primaryColor} direction={"down"}/>}
                    {<Triangle relativeX={queryX - TRIANGLE_SIZE} relativeY={height - rectHeight - LINE_MARGIN - LINE_WIDTH - TRIANGLE_SIZE} color={queryColor} direction={"up"}/>}
                    {<HorizontalLine relativeY={height - LINE_MARGIN - LINE_WIDTH} xSpan={queryXSpan} viewWindowStart={viewWindowStart} color={queryColor} locus={queryLocus} textHeight={-35}/>}
                </React.Fragment>
            )
        }
        return (
            <div
                onMouseMove={this.storeMouseCoordinates}
                onMouseLeave={this.clearMouseCoordinates}
                // style={mergedStyle}
                {...otherProps} 
            >
                {children}
                {lines}
            </div>
        );
    }
}

/**
 * The actual horizontal line that covers an alignment segment.
 * 
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} - element to render
 */
function HorizontalLine(props) {
    const {relativeY, xSpan, viewWindowStart, color,locus, textHeight} = props;
    const width = xSpan?xSpan.end - xSpan.start : 0;
    const locusTextSpan = locus.length * FONT_SIZE;
    const marginLeft = xSpan.start + width/2 - locusTextSpan/2 < viewWindowStart ? viewWindowStart - xSpan.start : width/2 - locusTextSpan/2;
    const horizontalLineStyle = {
        top: relativeY,
        left: xSpan?xSpan.start:0,
        width: width,
        height: 2,
        color: color,
        willChange: "top"
    };
    const textStyle = {"marginTop":textHeight, "whiteSpace":"nowrap", "marginLeft":marginLeft};

    return  xSpan ? <div className="Fragment-horizontal-line" style={horizontalLineStyle} > <p style={textStyle}>{locus}</p> </div>: null;
}

function Triangle(props) {
    const {relativeX, relativeY, color, direction} = props;
    const triangleStyle = {
        top: relativeY,
        left: relativeX,
        color: color,
    }
    const triangeClass = direction === "up" ? "arrow-up" : "arrow-down";
    return <div className={triangeClass} style={triangleStyle} />;
}

export default HorizontalFragment;
