import React from "react";
import { Tabs, Tab } from "react-bootstrap-tabs";
import FacetTable from "./trackManagers/FacetTable";

class FacetTableUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedTabIndex: 0,
        };
    }

    render() {
        const {
            publicTracksPool,
            customTracksPool,
            addedTracks,
            onTracksAdded,
            addedTrackSets,
            addTermToMetaSets,
        } = this.props;
        return (
            <Tabs
                onSelect={(index, label) => this.setState({ selectedTabIndex: index })}
                selected={this.state.selectedTabIndex}
                headerStyle={{ fontWeight: "bold" }}
                activeHeaderStyle={{ color: "blue" }}
            >
                <Tab label="Public tracks facet table">
                    <h1>Tracks from public hubs</h1>
                    {publicTracksPool.length > 0 ? (
                        <FacetTable
                            tracks={publicTracksPool}
                            addedTracks={addedTracks}
                            onTracksAdded={onTracksAdded}
                            addedTrackSets={addedTrackSets}
                            addTermToMetaSets={addTermToMetaSets}
                        />
                    ) : (
                        <p>No public tracks from data hubs yet. Load a hub first.</p>
                    )}
                </Tab>
                <Tab label="Custom tracks facet table">
                    <h1>Tracks from custom track or hubs</h1>
                    {customTracksPool.length > 0 ? (
                        <FacetTable
                            tracks={customTracksPool}
                            addedTracks={addedTracks}
                            onTracksAdded={onTracksAdded}
                            addedTrackSets={addedTrackSets}
                            addTermToMetaSets={addTermToMetaSets}
                        />
                    ) : (
                        <p>No custom tracks yet. Submit custom tracks or load custom data hub.</p>
                    )}
                </Tab>
            </Tabs>
        );
    }
}

export default FacetTableUI;
