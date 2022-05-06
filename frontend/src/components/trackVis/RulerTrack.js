import React from "react";
import PropTypes from "prop-types";

import Track from "./commonComponents/Track";
import HoverTooltipContext from "./commonComponents/tooltip/HoverTooltipContext";
import Chromosomes from "../genomeNavigator/Chromosomes";
import Ruler from "../genomeNavigator/Ruler";
import GenomicCoordinates from "./commonComponents/GenomicCoordinates";
import TrackLegend from "./commonComponents/TrackLegend";
import withCurrentGenome from "../withCurrentGenome";

import DisplayedRegionModel from "../../model/DisplayedRegionModel";
import { getGenomeConfig } from "../../model/genomes/allGenomes";
import { TrackModel } from "../../model/TrackModel";

const CHROMOSOMES_Y = 60;
const RULER_Y = 20;
const HEIGHT = 40;

/**
 * A ruler display.
 *
 * @author Silas Hsu
 */
class RulerVisualizer extends React.PureComponent {
  static propTypes = {
    genomeConfig: PropTypes.object.isRequired,
    trackModel: PropTypes.instanceOf(TrackModel).isRequired,
    viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired,
    width: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.getTooltipContents = this.getTooltipContents.bind(this);
  }

  getTooltipContents(relativeX) {
    const { viewRegion, width } = this.props;
    return (
      <GenomicCoordinates viewRegion={viewRegion} width={width} x={relativeX} />
    );
  }

  render() {
    const { viewRegion, width } = this.props;
    const genomeConfig = this.props.genomeConfig;
    return (
      <HoverTooltipContext
        tooltipRelativeY={RULER_Y}
        getTooltipContents={this.getTooltipContents}
      >
        {/* display: block prevents svg from taking extra bottom space */}
        <svg width={width} height={HEIGHT} style={{ display: "block" }}>
          <Chromosomes
            genomeConfig={genomeConfig}
            viewRegion={viewRegion}
            width={width}
            labelOffset={CHROMOSOMES_Y}
            hideChromName={true}
          />
          <Ruler viewRegion={viewRegion} width={width} y={RULER_Y} />
        </svg>
      </HoverTooltipContext>
    );
  }
}

// const Visualizer = withCurrentGenome(RulerVisualizer);

class RulerTrack extends React.Component {
  render() {
    const sencondaryGenome = this.props.trackModel.getMetadata("genome");
    const genomeConfig =
      getGenomeConfig(sencondaryGenome) || this.props.genomeConfig;
    const selectedRegion = sencondaryGenome
      ? this.props.viewRegion
      : this.props.selectedRegion;
    return (
      <Track
        {...this.props}
        legend={
          <TrackLegend
            height={HEIGHT}
            trackModel={this.props.trackModel}
            trackViewRegion={this.props.viewRegion}
            selectedRegion={selectedRegion}
            trackWidth={this.props.width}
          />
        }
        visualizer={
          <RulerVisualizer
            genomeConfig={genomeConfig}
            viewRegion={this.props.viewRegion}
            width={this.props.width}
            trackModel={this.props.trackModel}
          />
        }
      />
    );
  }
}

export default withCurrentGenome(RulerTrack);
