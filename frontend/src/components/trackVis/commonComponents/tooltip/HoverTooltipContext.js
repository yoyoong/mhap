import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from './Tooltip';
import { getRelativeCoordinates, getPageCoordinates } from '../../../../util';

/**
 * A <div> that displays a tooltip whenever the user hovers over it.
 * 
 * @author Silas Hsu
 */
class HoverTooltipContext extends React.PureComponent {
    static propTypes = {
        tooltipRelativeY: PropTypes.number, // y coordinate to render tooltip, relative to the top of the container

        /**
         * Called when the user mouses over the container.  Should return tooltip contents to render.  Signature
         *     (relativeX: number): JSX.Element
         *         `relativeX`: the x coordinate of the mouse hover, relative to the left of the container
         */
        getTooltipContents: PropTypes.func,
        // Remaining props get passed to the <div>
        useRelativeY: PropTypes.bool, // if need use relative y for tooltip
    };

    static defaultProps = {
        tooltipRelativeY: 0,
        getTooltipContents: relativeX => null,
        useRelativeY: false,
    };

    constructor(props) {
        super(props);
        this.state = {
            tooltip: null
        };
        this.showTooltip = this.showTooltip.bind(this);
        this.closeTooltip = this.closeTooltip.bind(this);
    }

    /**
     * Gets tooltip contents specified by props, and sets state to render it.
     * 
     * @param {MouseEvent} event - mouse event that triggered this callback
     */
    showTooltip(event) {
        const {tooltipRelativeY, getTooltipContents, useRelativeY} = this.props;
        const {x, y} = getRelativeCoordinates(event);
        const contents = useRelativeY ? getTooltipContents(x, y) : getTooltipContents(x);
        if (!contents) {
            this.closeTooltip();
            return;
        }
        const pageY = useRelativeY ? 
            getPageCoordinates(event.currentTarget, 0, y).y
            :
            getPageCoordinates(event.currentTarget, 0, tooltipRelativeY).y;
        const tooltip = (
            <Tooltip pageX={event.pageX} pageY={pageY} onClose={this.closeTooltip} ignoreMouse={true} >
                {contents}
            </Tooltip>
        );
        this.setState({tooltip: tooltip});
    }

    /**
     * Sets state to stop showing any tooltips.
     */
    closeTooltip() {
        this.setState({tooltip: null});
    }

    /**
     * @return {JSX.Element} children and the tooltip
     */
    render() {
        const {tooltipRelativeY, getTooltipContents, children, useRelativeY, ...otherProps} = this.props;
        return (
        <div onMouseMove={this.showTooltip} onMouseLeave={this.closeTooltip} {...otherProps} >
            {children}
            {this.state.tooltip}
        </div>
        );
    }
}

export default HoverTooltipContext;
