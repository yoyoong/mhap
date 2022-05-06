import React from 'react';
import { connect } from 'react-redux';
import { ActionCreators } from '../AppState';
// import App from '../App';
import TrackContainer from "./trackContainers/TrackContainer";
import { RegionExpander } from '../model/RegionExpander';
import { getGenomeConfig } from '../model/genomes/allGenomes';

const REGION_EXPANDER = new RegionExpander(1);

interface EmbeddedProps {
    onSetRestore: any;
    contents: any;
}

interface EmbeddedState {
    highlightEnteredRegion: boolean;
    enteredRegion: any;
}

class EmbeddedContainer extends React.PureComponent<EmbeddedProps, EmbeddedState> {

    constructor(props: EmbeddedProps) {
        super(props);
        this.state = {
            highlightEnteredRegion: true,
            enteredRegion: null,
        }
    }

    componentDidMount() {
        const { genomeName, displayRegion, trackLegendWidth, isShowingNavigator, tracks,
            metadataTerms, regionSets, regionSetViewIndex } = this.props.contents;
        const state = {
            genomeName,
            displayRegion,
            trackLegendWidth,
            tracks,
            isShowingNavigator,
            metadataTerms,
            regionSets,
            regionSetViewIndex,
        };
        this.props.onSetRestore(genomeName, state);
    }

    toggleHighlight = () => {
        this.setState(prevState => ({ highlightEnteredRegion: !prevState.highlightEnteredRegion }));
    };

    setEnteredRegion = (interval: any) => {
        this.setState({ enteredRegion: interval });
    }

    render(): JSX.Element {
        // somehow react complain `Property 'embeddingMode' does not exist on type 'IntrinsicAttributes'
        // if I give the prop directly
        const otherProps = { ...this.props, embeddingMode: true };
        // return <App {...otherProps}/>;
        return <TrackContainer
            expansionAmount={REGION_EXPANDER}
            suggestedMetaSets={new Set(["Track type"])}
            onToggleHighlight={this.toggleHighlight}
            onSetEnteredRegion={this.setEnteredRegion}
            {...otherProps}
        />;
    }
};

// const mapStateToProps = (state: any) => {
//     return {
//         browser: state.browser,
//     };
// }

const mapStateToProps = (state: any) => {
    return {
        genome: state.browser.present.genomeName,
        viewRegion: state.browser.present.viewRegion,
        tracks: state.browser.present.tracks,
        metadataTerms: state.browser.present.metadataTerms,
        genomeConfig: getGenomeConfig(state.browser.present.genomeName)
    };
}

const callbacks = {
    onNewRegion: ActionCreators.setViewRegion,
    onTracksChanged: ActionCreators.setTracks,
    onMetadataTermsChanged: ActionCreators.setMetadataTerms,
    onSetRestore: ActionCreators.setGenomeRestoreSession,
};


export default connect(mapStateToProps, callbacks)(EmbeddedContainer);
