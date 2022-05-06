import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import axios from "axios";
import Autosuggest from "react-autosuggest";
import { Manager, Target, Popper } from "react-popper";
import SpeechRecognition from "react-speech-recognition";
import withCurrentGenome from "../withCurrentGenome";
import IsoformSelection from "./IsoformSelection";
import OutsideClickDetector from "../OutsideClickDetector";
import { Genome } from "../../model/genomes/Genome";
import { AWS_API } from "../../dataSources/GeneSource";

import "../../autosuggest.css";
import "./GeneSearchBox.css";

const MIN_CHARS_FOR_SUGGESTIONS = 3; // Minimum characters to type before displaying suggestions
const ENTER_KEY_CODE = 13;
const ISOFORM_POPOVER_STYLE = {
    zIndex: 10,
    border: "2px solid grey",
    backgroundColor: "white",
    maxHeight: "800px",
    overflow: "auto",
};
const DEBOUNCE_INTERVAL = 250;
const options = {
    autoStart: false,
};

/**
 * A box that accepts gene name queries, and gives suggestions as well.
 *
 * @author Daofeng Li and Silas Hsu
 */
class GeneSearchBoxBase extends React.PureComponent {
    static propTypes = {
        genomeConfig: PropTypes.shape({
            // Current genome
            genome: PropTypes.instanceOf(Genome).isRequired,
        }).isRequired,
        onGeneSelected: PropTypes.func.isRequired,
        voiceInput: PropTypes.bool,
        simpleMode: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.input = null;
        this.state = {
            inputValue: "", //user's input
            suggestions: [], // Matching gene symbols for the current input
            isShowingIsoforms: false,
            speechInput: false, // text search input or speech
        };
        this.getSuggestions = _.debounce(this.getSuggestions, DEBOUNCE_INTERVAL);
    }

    handleInputChange = (event, { newValue }) => {
        this.setState({ inputValue: newValue, isShowingIsoforms: false });
    };

    shouldSuggest = (value) => {
        return !this.state.isShowingIsoforms && value.trim().length >= MIN_CHARS_FOR_SUGGESTIONS;
    };

    getSuggestions = async (changeData) => {
        const genomeName = this.props.genomeConfig.genome.getName();
        const params = {
            q: changeData.value.trim(),
            getOnlyNames: true,
        };
        const response = await axios.get(`${AWS_API}/${genomeName}/genes/queryName`, { params: params });
        this.setState({ suggestions: response.data });
    };

    showIsoforms = () => {
        this.setState({ suggestions: [], isShowingIsoforms: true });
    };

    showIsoformsIfEnterPressed = (event) => {
        if (event.keyCode === ENTER_KEY_CODE) {
            this.showIsoforms();
        }
    };

    /**
     * @param {Gene} gene
     */
    setSelectedGene = (gene) => {
        if (this.props.onGeneSelected) {
            this.props.onGeneSelected(gene);
        }
        this.setState({ isShowingIsoforms: false });
    };

    startListening = () => {
        const { startListening } = this.props;
        startListening();
        this.setState({
            speechInput: true,
        });
    };

    stopListening = () => {
        const { stopListening } = this.props;
        stopListening();
        this.setState({
            speechInput: false,
        });
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.transcript) {
            return {
                inputValue: nextProps.transcript.replace(/\s/g, ""),
            };
        } else {
            return null;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.inputValue !== this.state.inputValue) {
            this.input.input.focus();
        }
    }

    render() {
        const { suggestions, isShowingIsoforms, inputValue } = this.state;
        const { simpleMode, voiceInput } = this.props;
        let speechSearchBox;
        if (voiceInput) {
            const { resetTranscript, browserSupportsSpeechRecognition } = this.props;
            if (browserSupportsSpeechRecognition) {
                speechSearchBox = (
                    <div className="GeneSearchBox-speech">
                        <button className="btn btn-success btn-sm" onClick={this.startListening}>
                            Say a Gene
                        </button>
                        <button className="btn btn-info btn-sm" onClick={resetTranscript}>
                            Reset
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={this.stopListening}>
                            Stop
                        </button>
                    </div>
                );
            }
        }
        let isoformPane = null;
        if (isShowingIsoforms) {
            isoformPane = (
                <Popper placement="bottom-start" style={ISOFORM_POPOVER_STYLE}>
                    <OutsideClickDetector onOutsideClick={() => this.setState({ isShowingIsoforms: false })}>
                        <IsoformSelection
                            geneName={inputValue}
                            onGeneSelected={this.setSelectedGene}
                            simpleMode={simpleMode}
                        />
                    </OutsideClickDetector>
                </Popper>
            );
        }

        return (
            <div>
                {speechSearchBox}
                {/* <label style={{ marginBottom: 0 }}>Gene search</label> */}
                <Manager>
                    <Target>
                        <Autosuggest
                            suggestions={suggestions}
                            shouldRenderSuggestions={this.shouldSuggest}
                            onSuggestionsFetchRequested={this.getSuggestions}
                            onSuggestionsClearRequested={() => this.setState({ nameSuggestions: [] })}
                            getSuggestionValue={_.identity}
                            renderSuggestion={_.identity}
                            inputProps={{
                                placeholder: "Gene symbol",
                                value: inputValue,
                                onChange: this.handleInputChange,
                                onKeyUp: this.showIsoformsIfEnterPressed,
                            }}
                            ref={(input) => (this.input = input)}
                            onSuggestionSelected={this.showIsoforms}
                        />
                    </Target>
                    {isoformPane}
                </Manager>
            </div>
        );
    }
}

export default withCurrentGenome(SpeechRecognition(options)(GeneSearchBoxBase));
