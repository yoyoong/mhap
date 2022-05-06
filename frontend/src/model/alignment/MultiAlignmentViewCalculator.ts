import { TrackModel } from "model/TrackModel";
import { GenomeConfig } from "./../genomes/GenomeConfig";
import _ from "lodash";
import memoizeOne from "memoize-one";
// import { GuaranteeMap } from '../../model/GuaranteeMap';

import { segmentSequence, makeBaseNumberLookup, countBases, SequenceSegment, GAP_CHAR } from "./AlignmentStringUtils";
import { AlignmentRecord } from "./AlignmentRecord";
import { AlignmentSegment } from "./AlignmentSegment";
import { AlignmentFetcher } from "./AlignmentFetcher";
import { NavContextBuilder, Gap } from "./NavContextBuilder";

import ChromosomeInterval from "../interval/ChromosomeInterval";
import OpenInterval from "../interval/OpenInterval";
import NavigationContext from "../NavigationContext";
import LinearDrawingModel from "../LinearDrawingModel";
import { Feature } from "../Feature";

import { ViewExpansion } from "../RegionExpander";
import { FeaturePlacer } from "../FeaturePlacer";
import DisplayedRegionModel from "../DisplayedRegionModel";
import { niceBpCount } from "../../util";

export interface PlacedAlignment {
    record: AlignmentRecord;
    visiblePart: AlignmentSegment;
    contextSpan: OpenInterval;
    targetXSpan: OpenInterval;
    queryXSpan: OpenInterval;
    targetSegments?: PlacedSequenceSegment[]; // These only present in fine mode
    querySegments?: PlacedSequenceSegment[];
}

export interface PlacedSequenceSegment extends SequenceSegment {
    xSpan: OpenInterval;
}

interface QueryGenomePiece {
    queryFeature: Feature;
    queryXSpan: OpenInterval;
}

export interface PlacedMergedAlignment extends QueryGenomePiece {
    segments: PlacedAlignment[];
    targetXSpan: OpenInterval;
}

export interface GapText {
    targetGapText: string;
    targetXSpan: OpenInterval;
    targetTextXSpan: OpenInterval;
    queryGapText: string;
    queryXSpan: OpenInterval;
    queryTextXSpan: OpenInterval;
    shiftTarget: boolean; // Whether target txt width > gap width
    shiftQuery: boolean; // Whether query txt width > gap width
}

export interface Alignment {
    isFineMode: boolean; // Display mode
    primaryVisData: ViewExpansion; // Primary genome view region data
    queryRegion: DisplayedRegionModel; // Query genome view region
    /**
     * PlacedAlignment[] in fine mode; PlacedMergedAlignment in rough mode.
     */
    drawData: PlacedAlignment[] | PlacedMergedAlignment[];
    drawGapText?: GapText[]; // An array holding gap size information between placedAlignments, fineMode only
    plotStrand?: string; // rough mode plot positive or negative
    primaryGenome: string;
    queryGenome: string;
    basesPerPixel: number;
}

export interface MultiAlignment {
    [genome: string]: Alignment;
}

interface RecordsObj {
    query: string;
    records: AlignmentRecord[];
    isBigChain?: boolean;
}

interface RefinedObj {
    newRecordsArray: RecordsObj[];
    allGaps: Gap[];
}

const MAX_FINE_MODE_BASES_PER_PIXEL = 10;
const MARGIN = 5;
// const MIN_GAP_DRAW_WIDTH = 3;
const MIN_GAP_LENGTH = 0.99;
const MERGE_PIXEL_DISTANCE = 200;
const MIN_MERGE_DRAW_WIDTH = 5;
const FEATURE_PLACER = new FeaturePlacer();

export class MultiAlignmentViewCalculator {
    private primaryGenome: string;
    private _alignmentFetchers: AlignmentFetcher[];

    constructor(primaryGenomeConfig: GenomeConfig, queryTracks: TrackModel[]) {
        this._alignmentFetchers = queryTracks.map((track) => new AlignmentFetcher(primaryGenomeConfig, track));
        this.primaryGenome = primaryGenomeConfig.genome.getName();
        this.multiAlign = memoizeOne(this.multiAlign);
    }

    cleanUp() {
        this._alignmentFetchers.forEach((fetcher) => fetcher.cleanUp());
    }

    async multiAlign(visData: ViewExpansion): Promise<MultiAlignment> {
        const { visRegion, visWidth, viewWindowRegion } = visData;

        const drawModel = new LinearDrawingModel(visRegion, visWidth);
        const viewReregionReachFineMode = drawModel.xWidthToBases(1) < MAX_FINE_MODE_BASES_PER_PIXEL;
        let recordsArray: RecordsObj[];
        if (viewReregionReachFineMode) {
            const recordsPromise = this._alignmentFetchers.map(async (fetcher) => {
                const records = await fetcher.fetchAlignment(visRegion, visData, false);
                return { query: fetcher.queryGenome, records: records, isBigChain: fetcher.isBigChain };
            });
            const oldRecordsArray = await Promise.all(recordsPromise);
            const { newRecordsArray, allGaps } = this.refineRecordsArray(oldRecordsArray, visData);
            recordsArray = newRecordsArray;

            const primaryVisData = this.calculatePrimaryVis(allGaps, visData);
            return recordsArray.reduce(
                (multiAlign, records) => ({
                    ...multiAlign,
                    [records.query]: records.isBigChain
                        ? this.alignRough(records.query, records.records, visData)
                        : this.alignFine(records.query, records.records, visData, primaryVisData, allGaps),
                }),
                {}
            );
        } else {
            const recordsPromise = this._alignmentFetchers.map(async (fetcher) => {
                const records = await fetcher.fetchAlignment(viewWindowRegion, visData, true);
                return { query: fetcher.queryGenome, records: records };
            });
            recordsArray = await Promise.all(recordsPromise);

            // Don't need to change each records for rough alignment, directly loop through them:
            return recordsArray.reduce(
                (multiAlign, records) => ({
                    ...multiAlign,
                    [records.query]: this.alignRough(records.query, records.records, visData),
                }),
                {}
            );
        }
    }

    calculatePrimaryVis(allGaps: Gap[], visData: ViewExpansion): ViewExpansion {
        // Calculate primary visData that have all the primary gaps from different alignemnts insertions.
        const { visRegion, viewWindow, viewWindowRegion } = visData;
        const oldNavContext = visRegion.getNavigationContext();
        const navContextBuilder = new NavContextBuilder(oldNavContext);
        navContextBuilder.setGaps(allGaps);
        const newNavContext = navContextBuilder.build();
        // Calculate new DisplayedRegionModel and LinearDrawingModel from the new nav context
        const newVisRegion = convertOldVisRegion(visRegion);
        const newViewWindowRegion = convertOldVisRegion(viewWindowRegion);
        const newPixelsPerBase = viewWindow.getLength() / newViewWindowRegion.getWidth();
        const newVisWidth = newVisRegion.getWidth() * newPixelsPerBase;
        const newDrawModel = new LinearDrawingModel(newVisRegion, newVisWidth);
        const newViewWindow = newDrawModel.baseSpanToXSpan(newViewWindowRegion.getContextCoordinates());

        return {
            visRegion: newVisRegion,
            visWidth: newVisWidth,
            viewWindowRegion: newViewWindowRegion,
            viewWindow: newViewWindow,
        };

        function convertOldVisRegion(visRegion: DisplayedRegionModel) {
            const [contextStart, contextEnd] = visRegion.getContextCoordinates();
            return new DisplayedRegionModel(
                newNavContext,
                navContextBuilder.convertOldCoordinates(contextStart),
                navContextBuilder.convertOldCoordinates(contextEnd)
            );
        }
    }
    // return a new recordObj array with gaps inserted, and allGap contextBase.
    refineRecordsArray(recordsArray: RecordsObj[], visData: ViewExpansion): RefinedObj {
        const minGapLength = MIN_GAP_LENGTH;

        // use a new array of objects to manipulate later, and
        // Combine all gaps from all alignments into a new array:
        const refineRecords = [];
        const allGapsObj = {};
        for (const recordsObj of recordsArray) {
            // Calculate context coordinates of the records and gaps within.
            const placements = this._computeContextLocations(recordsObj.records, visData);
            const primaryGaps = this._getPrimaryGenomeGaps(placements, minGapLength);
            const primaryGapsObj = primaryGaps.reduce((resultObj, gap) => {
                return { ...resultObj, ...{ [gap.contextBase]: gap.length } };
            }, {});
            refineRecords.push({
                recordsObj: recordsObj,
                placements: placements,
                primaryGapsObj: primaryGapsObj,
            });
            for (const contextBase of Object.keys(primaryGapsObj)) {
                if (contextBase in allGapsObj) {
                    allGapsObj[contextBase] = Math.max(allGapsObj[contextBase], primaryGapsObj[contextBase]);
                } else {
                    allGapsObj[contextBase] = primaryGapsObj[contextBase];
                }
            }
        }

        // Build a new primary navigation context using the gaps
        const allPrimaryGaps = [];
        for (const contextBase of Object.keys(allGapsObj)) {
            allPrimaryGaps.push({
                contextBase: Number(contextBase),
                length: allGapsObj[contextBase],
            });
        }
        allPrimaryGaps.sort((a, b) => a.contextBase - b.contextBase); // ascending.

        // For each records, insertion gaps to sequences if for contextBase only in allGapsSet:
        if (refineRecords.length > 1) {
            // skip this part for pairwise alignment.
            for (const records of refineRecords) {
                const insertionContexts = [];
                for (const contextBase of Object.keys(allGapsObj)) {
                    if (contextBase in records.primaryGapsObj) {
                        const lengthDiff = allGapsObj[contextBase] - records.primaryGapsObj[contextBase];
                        if (lengthDiff > 0) {
                            insertionContexts.push({
                                contextBase: Number(contextBase),
                                length: lengthDiff,
                            });
                        }
                    } else {
                        insertionContexts.push({
                            contextBase: Number(contextBase),
                            length: allGapsObj[contextBase],
                        });
                    }
                }
                insertionContexts.sort((a, b) => b.contextBase - a.contextBase); // sort descending...
                for (const insertPosition of insertionContexts) {
                    const gapString = "-".repeat(insertPosition.length);
                    const insertBase = insertPosition.contextBase;
                    const thePlacement = records.placements.filter(
                        (placement) =>
                            placement.contextSpan.start < insertBase && placement.contextSpan.end > insertBase
                    )[0]; // There could only be 0 or 1 placement pass the filter.
                    if (thePlacement) {
                        const visibleTargetSeq = thePlacement.visiblePart.getTargetSequence();
                        const insertIndex = indexLookup(visibleTargetSeq, insertBase - thePlacement.contextSpan.start);
                        const relativePosition = thePlacement.visiblePart.sequenceInterval.start + insertIndex;
                        const targetSeq = thePlacement.record.targetSeq;
                        const querySeq = thePlacement.record.querySeq;
                        thePlacement.record.targetSeq =
                            targetSeq.slice(0, relativePosition) + gapString + targetSeq.slice(relativePosition);
                        thePlacement.record.querySeq =
                            querySeq.slice(0, relativePosition) + gapString + querySeq.slice(relativePosition);
                    }
                }

                records.recordsObj.records = records.placements.map((placement) => placement.record);
            }
        }
        const newRecords = refineRecords.map((final) => final.recordsObj);
        return { newRecordsArray: newRecords, allGaps: allPrimaryGaps };

        function indexLookup(sequence: string, base: number): number {
            let index = 0;
            for (const char of sequence) {
                index++;
                if (char !== GAP_CHAR) {
                    base--;
                }
                if (base === 0) {
                    break;
                }
            }
            return index;
        }
    }
    alignFine(
        query: string,
        records: AlignmentRecord[],
        oldVisData: ViewExpansion,
        visData: ViewExpansion,
        allGaps: Gap[]
    ): Alignment {
        // There's a lot of steps, so bear with me...
        const { visRegion, visWidth } = visData;
        // drawModel is derived from visData:
        const drawModel = new LinearDrawingModel(visRegion, visWidth);
        // const minGapLength = drawModel.xWidthToBases(MIN_GAP_DRAW_WIDTH);
        const minGapLength = MIN_GAP_LENGTH;

        // Calculate context coordinates of the records and gaps within.
        // calculate navContext and placements using oldVisData so small gaps won't seperate different features:
        const navContext = oldVisData.visRegion.getNavigationContext();
        const placements = this._computeContextLocations(records, oldVisData);
        // const primaryGaps = this._getPrimaryGenomeGaps(placements, minGapLength);
        const navContextBuilder = new NavContextBuilder(navContext);
        navContextBuilder.setGaps(allGaps); // Use allGaps instead of primaryGaps here so gaps between placements were also included here.
        // With the draw model, we can set x spans for each placed alignment
        // Adjust contextSpan and xSpan in placements using visData:
        for (const placement of placements) {
            const oldContextSpan = placement.contextSpan;
            const visiblePart = placement.visiblePart;
            const newContextSpan = new OpenInterval(
                navContextBuilder.convertOldCoordinates(oldContextSpan.start),
                navContextBuilder.convertOldCoordinates(oldContextSpan.end)
            );
            const xSpan = drawModel.baseSpanToXSpan(newContextSpan);
            const targetSeq = visiblePart.getTargetSequence();
            const querySeq = visiblePart.getQuerySequence();

            placement.contextSpan = newContextSpan;
            placement.targetXSpan = xSpan;
            placement.queryXSpan = xSpan;
            placement.targetSegments = this._placeSequenceSegments(targetSeq, minGapLength, xSpan.start, drawModel);
            placement.querySegments = this._placeSequenceSegments(querySeq, minGapLength, xSpan.start, drawModel);
        }
        const drawGapTexts = [];
        const targetIntervalPlacer = new IntervalPlacer(MARGIN);
        const queryIntervalPlacer = new IntervalPlacer(MARGIN);
        for (let i = 1; i < placements.length; i++) {
            const lastPlacement = placements[i - 1];
            const placement = placements[i];
            const lastXEnd = lastPlacement.targetXSpan.end;
            const xStart = placement.targetXSpan.start;
            const lastTargetChr = lastPlacement.record.locus.chr;
            const lastTargetEnd = lastPlacement.record.locus.end;
            const lastQueryChr = lastPlacement.record.queryLocus.chr;
            const lastStrand = lastPlacement.record.queryStrand;
            const lastQueryEnd =
                lastStrand === "+" ? lastPlacement.record.queryLocus.end : lastPlacement.record.queryLocus.start;
            const targetChr = placement.record.locus.chr;
            const targetStart = placement.record.locus.start;
            const queryChr = placement.record.queryLocus.chr;
            const queryStrand = placement.record.queryStrand;
            const queryStart =
                queryStrand === "+" ? placement.record.queryLocus.start : placement.record.queryLocus.end;
            let placementQueryGap: string;
            if (lastQueryChr === queryChr) {
                if (lastStrand === "+" && queryStrand === "+") {
                    placementQueryGap = queryStart >= lastQueryEnd ? "" : "overlap ";
                    placementQueryGap += niceBpCount(Math.abs(queryStart - lastQueryEnd));
                } else if (lastStrand === "-" && queryStrand === "-") {
                    placementQueryGap = lastQueryEnd >= queryStart ? "" : "overlap ";
                    placementQueryGap += niceBpCount(Math.abs(lastQueryEnd - queryStart));
                } else {
                    placementQueryGap = "reverse direction";
                }
            } else {
                placementQueryGap = "not connected";
            }
            const placementGapX = (lastXEnd + xStart) / 2;
            const queryPlacementGapX = (lastPlacement.queryXSpan.end + placement.queryXSpan.start) / 2;
            const placementTargetGap =
                lastTargetChr === targetChr ? niceBpCount(targetStart - lastTargetEnd) : "not connected";

            const targetTextWidth = placementTargetGap.length * 5; // use font size 10...
            const halfTargetTextWidth = 0.5 * targetTextWidth;
            const preferredTargetStart = placementGapX - halfTargetTextWidth;
            const preferredTargetEnd = placementGapX + halfTargetTextWidth;
            // shift text position only if the width of text is bigger than the gap size:
            const shiftTargetTxt = preferredTargetStart <= lastXEnd || preferredTargetEnd >= xStart;
            const targetGapTextXSpan = shiftTargetTxt
                ? targetIntervalPlacer.place(new OpenInterval(preferredTargetStart, preferredTargetEnd))
                : new OpenInterval(preferredTargetStart, preferredTargetEnd);
            const targetGapXSpan = new OpenInterval(lastXEnd, xStart);

            const queryTextWidth = placementQueryGap.length * 5; // use font size 10...
            const halfQueryTextWidth = 0.5 * queryTextWidth;
            const preferredQueryStart = queryPlacementGapX - halfQueryTextWidth;
            const preferredQueryEnd = queryPlacementGapX + halfQueryTextWidth;
            // shift text position only if the width of text is bigger than the gap size:
            const shiftQueryTxt =
                preferredQueryStart <= lastPlacement.queryXSpan.end || preferredQueryEnd >= placement.queryXSpan.start;
            const queryGapTextXSpan = shiftQueryTxt
                ? queryIntervalPlacer.place(new OpenInterval(preferredQueryStart, preferredQueryEnd))
                : new OpenInterval(preferredQueryStart, preferredQueryEnd);
            const queryGapXSpan = new OpenInterval(lastPlacement.queryXSpan.end, placement.queryXSpan.start);
            drawGapTexts.push({
                targetGapText: placementTargetGap,
                targetXSpan: targetGapXSpan,
                targetTextXSpan: targetGapTextXSpan,
                queryGapText: placementQueryGap,
                queryXSpan: queryGapXSpan,
                queryTextXSpan: queryGapTextXSpan,
                shiftTarget: shiftTargetTxt,
                shiftQuery: shiftQueryTxt,
            });
        }
        // Finally, using the x coordinates, construct the query nav context
        const queryPieces = this._getQueryPieces(placements);
        const queryRegion = this._makeQueryGenomeRegion(queryPieces, visWidth, drawModel);
        return {
            isFineMode: true,
            primaryVisData: visData,
            queryRegion,
            drawData: placements,
            drawGapText: drawGapTexts,
            primaryGenome: this.primaryGenome,
            queryGenome: query,
            basesPerPixel: drawModel.xWidthToBases(1),
        };
    }

    /**
     * Groups and merges alignment records based on their proximity in the query (secondary) genome.  Then, calculates
     * draw positions for all records.
     *
     * @param {AlignmentRecord[]} alignmentRecords - records to process
     * @param {DisplayedRegionModel} viewRegion - view region of the primary genome
     * @param {number} width - view width of the primary genome
     * @return {PlacedMergedAlignment[]} placed merged alignments
     */
    alignRough(query: string, alignmentRecords: AlignmentRecord[], visData: ViewExpansion): Alignment {
        const { visRegion, visWidth } = visData;
        const drawModel = new LinearDrawingModel(visRegion, visWidth);
        const mergeDistance = drawModel.xWidthToBases(MERGE_PIXEL_DISTANCE);

        // Count how many bases are in positive strand and how many of them are in negative strand.
        // More in negative strand (<0) => plotStrand = "-".
        const aggregateStrandsNumber = alignmentRecords.reduce(
            (aggregateStrand, record) =>
                aggregateStrand + (record.getIsReverseStrandQuery() ? -1 * record.getLength() : record.getLength()),
            0
        );
        const plotStrand = aggregateStrandsNumber < 0 ? "-" : "+";

        const placedRecords = this._computeContextLocations(alignmentRecords, visData);
        // First, merge the alignments by query genome coordinates
        let queryLocusMerges = ChromosomeInterval.mergeAdvanced(
            // Note that the third parameter gets query loci
            placedRecords,
            mergeDistance,
            (placement) => placement.visiblePart.getQueryLocus()
        );

        // Sort so we place the largest query loci first in the next step
        queryLocusMerges = queryLocusMerges.sort((a, b) => b.locus.getLength() - a.locus.getLength());

        const intervalPlacer = new IntervalPlacer(MARGIN);
        const drawData: PlacedMergedAlignment[] = [];
        for (const merge of queryLocusMerges) {
            const mergeLocus = merge.locus;
            const placementsInMerge = merge.sources; // Placements that made the merged locus
            const mergeDrawWidth = drawModel.basesToXWidth(mergeLocus.getLength());
            const halfDrawWidth = 0.5 * mergeDrawWidth;
            if (mergeDrawWidth < MIN_MERGE_DRAW_WIDTH) {
                continue;
            }

            // Find the center of the primary segments, and try to center the merged query locus there too.
            const drawCenter = computeCentroid(placementsInMerge.map((segment) => segment.targetXSpan));
            const targetXStart = Math.min(...placementsInMerge.map((segment) => segment.targetXSpan.start));
            const targetEnd = Math.max(...placementsInMerge.map((segment) => segment.targetXSpan.end));
            const mergeTargetXSpan = new OpenInterval(targetXStart, targetEnd);
            const preferredStart = drawCenter - halfDrawWidth;
            const preferredEnd = drawCenter + halfDrawWidth;
            // Place it so it doesn't overlap other segments
            const mergeXSpan = intervalPlacer.place(new OpenInterval(preferredStart, preferredEnd));

            // Put the actual secondary/query genome segments in the placed merged query locus from above
            const queryLoci = placementsInMerge.map((placement) => placement.record.queryLocus);
            const isReverse = plotStrand === "-" ? true : false;
            const lociXSpans = this._placeInternalLoci(mergeLocus, queryLoci, mergeXSpan, isReverse, drawModel);
            for (let i = 0; i < queryLoci.length; i++) {
                placementsInMerge[i].queryXSpan = lociXSpans[i];
            }

            drawData.push({
                queryFeature: new Feature(undefined, mergeLocus, plotStrand),
                targetXSpan: mergeTargetXSpan,
                queryXSpan: mergeXSpan,
                segments: placementsInMerge,
            });
        }

        return {
            isFineMode: false,
            primaryVisData: visData,
            queryRegion: this._makeQueryGenomeRegion(drawData, visWidth, drawModel),
            drawData,
            plotStrand,
            primaryGenome: this.primaryGenome,
            queryGenome: query,
            basesPerPixel: drawModel.xWidthToBases(1),
        };
    }

    /**
     * Calculates context coordinates in the *primary* genome for alignment records.  Returns PlacedAlignments with NO x
     * coordinates set.  Make sure you set them before returning them in any public API!
     *
     * @param records
     * @param visData
     */
    _computeContextLocations(records: AlignmentRecord[], visData: ViewExpansion): PlacedAlignment[] {
        const { visRegion, visWidth } = visData;
        return FEATURE_PLACER.placeFeatures(records, visRegion, visWidth).map((placement) => {
            return {
                record: placement.feature as AlignmentRecord,
                visiblePart: AlignmentSegment.fromFeatureSegment(placement.visiblePart),
                contextSpan: placement.contextLocation,
                targetXSpan: placement.xSpan,
                queryXSpan: null,
            };
        });
    }

    /**
     *
     * @param placedAlignment
     * @param minGapLength
     */
    _getPrimaryGenomeGaps(placements: PlacedAlignment[], minGapLength: number): Gap[] {
        const gaps = [];
        for (const placement of placements) {
            const { visiblePart, contextSpan } = placement;
            const segments = segmentSequence(visiblePart.getTargetSequence(), minGapLength, true);
            const baseLookup = makeBaseNumberLookup(visiblePart.getTargetSequence(), contextSpan.start);
            for (const segment of segments) {
                gaps.push({
                    contextBase: baseLookup[segment.index],
                    length: segment.length,
                });
            }
        }
        return gaps;
    }

    _placeSequenceSegments(sequence: string, minGapLength: number, startX: number, drawModel: LinearDrawingModel) {
        const segments = segmentSequence(sequence, minGapLength);
        segments.sort((a, b) => a.index - b.index);
        let x = startX;
        for (const segment of segments) {
            const bases = segment.isGap ? segment.length : countBases(sequence.substr(segment.index, segment.length));
            const xSpanLength = drawModel.basesToXWidth(bases);
            (segment as PlacedSequenceSegment).xSpan = new OpenInterval(x, x + xSpanLength);
            x += xSpanLength;
        }
        return segments as PlacedSequenceSegment[];
    }

    /**
     *
     * @param placements
     * @param minGapLength
     * @param pixelsPerBase
     */
    _getQueryPieces(placements: PlacedAlignment[]): QueryGenomePiece[] {
        const queryPieces: QueryGenomePiece[] = [];
        for (const placement of placements) {
            const { record, visiblePart } = placement;
            const isReverse = record.getIsReverseStrandQuery();
            const querySeq = visiblePart.getQuerySequence();
            let baseLookup;
            if (isReverse) {
                baseLookup = makeBaseNumberLookup(querySeq, visiblePart.getQueryLocusFine().end, true);
            } else {
                baseLookup = makeBaseNumberLookup(querySeq, visiblePart.getQueryLocusFine().start);
            }
            const queryChr = record.queryLocus.chr;

            for (const segment of placement.querySegments) {
                const { isGap, index, length, xSpan } = segment;
                if (isGap) {
                    continue;
                }

                const base = baseLookup[index];
                const locusLength = countBases(querySeq.substr(index, length));
                let segmentLocus;
                if (isReverse) {
                    segmentLocus = new ChromosomeInterval(queryChr, base - locusLength, base);
                } else {
                    segmentLocus = new ChromosomeInterval(queryChr, base, base + locusLength);
                }
                queryPieces.push({
                    queryFeature: new Feature(undefined, segmentLocus, record.queryStrand),
                    queryXSpan: xSpan,
                });
            }
        }

        return queryPieces;
    }

    _makeQueryGenomeRegion(
        genomePieces: QueryGenomePiece[],
        visWidth: number,
        drawModel: LinearDrawingModel
    ): DisplayedRegionModel {
        // Sort by start
        const sortedPieces = genomePieces.slice().sort((a, b) => a.queryXSpan.start - b.queryXSpan.start);
        const features = [];

        let x = 0;
        let prevLocus = new ChromosomeInterval("", -1, -1); // Placeholder
        for (const piece of sortedPieces) {
            const { queryXSpan, queryFeature } = piece;
            const queryLocus = queryFeature.getLocus();

            const gapPixels = queryXSpan.start - x; // Compute potential gap
            const gapBases = Math.round(drawModel.xWidthToBases(gapPixels));
            if (gapBases >= 1) {
                const specialName = doLociTouchInGenome(queryLocus, prevLocus)
                    ? `${niceBpCount(gapBases)} gap`
                    : undefined;
                features.push(NavigationContext.makeGap(gapBases, specialName));
            }

            features.push(queryFeature);
            x = queryXSpan.end;
            prevLocus = queryLocus;
        }

        const finalGapBases = Math.round(drawModel.xWidthToBases(visWidth - x));
        if (finalGapBases > 0) {
            features.push(NavigationContext.makeGap(finalGapBases));
        }
        return new DisplayedRegionModel(new NavigationContext("", features));
    }

    _placeInternalLoci(
        parentLocus: ChromosomeInterval,
        internalLoci: ChromosomeInterval[],
        parentXSpan: OpenInterval,
        drawReverse: boolean,
        drawModel: LinearDrawingModel
    ) {
        const xSpans = [];
        if (drawReverse) {
            // place segments from right to left if drawReverse
            for (const locus of internalLoci) {
                const distanceFromParent = locus.start - parentLocus.start;
                const xDistanceFromParent = drawModel.basesToXWidth(distanceFromParent);
                const locusXEnd = parentXSpan.end - xDistanceFromParent;
                const xWidth = drawModel.basesToXWidth(locus.getLength());
                const xEnd = locusXEnd < parentXSpan.end ? locusXEnd : parentXSpan.end;
                const xStart = locusXEnd - xWidth > parentXSpan.start ? locusXEnd - xWidth : parentXSpan.start;
                xSpans.push(new OpenInterval(xStart, xEnd));
            }
        } else {
            for (const locus of internalLoci) {
                const distanceFromParent = locus.start - parentLocus.start;
                const xDistanceFromParent = drawModel.basesToXWidth(distanceFromParent);
                const locusXStart = parentXSpan.start + xDistanceFromParent;
                const xWidth = drawModel.basesToXWidth(locus.getLength());
                const xStart = locusXStart > parentXSpan.start ? locusXStart : parentXSpan.start;
                const xEnd = locusXStart + xWidth < parentXSpan.end ? locusXStart + xWidth : parentXSpan.end;
                xSpans.push(new OpenInterval(xStart, xEnd));
            }
        }
        return xSpans;
    }
}

class IntervalPlacer {
    public leftExtent: number;
    public rightExtent: number;
    public margin: number;
    private _placements: OpenInterval[];

    constructor(margin = 0) {
        this.leftExtent = Infinity;
        this.rightExtent = -Infinity;
        this.margin = margin;
        this._placements = [];
    }

    place(preferredLocation: OpenInterval) {
        let finalLocation = preferredLocation;
        if (this._placements.some((placement) => placement.getOverlap(preferredLocation) != null)) {
            const center = 0.5 * (preferredLocation.start + preferredLocation.end);
            const isInsertLeft = Math.abs(center - this.leftExtent) < Math.abs(center - this.rightExtent);
            finalLocation = isInsertLeft
                ? new OpenInterval(this.leftExtent - preferredLocation.getLength(), this.leftExtent)
                : new OpenInterval(this.rightExtent, this.rightExtent + preferredLocation.getLength());
        }

        this._placements.push(finalLocation);
        if (finalLocation.start < this.leftExtent) {
            this.leftExtent = finalLocation.start - this.margin;
        }
        if (finalLocation.end > this.rightExtent) {
            this.rightExtent = finalLocation.end + this.margin;
        }

        return finalLocation;
    }

    retrievePlacements() {
        return this._placements;
    }
}

function computeCentroid(intervals: OpenInterval[]) {
    const numerator = _.sumBy(intervals, (interval) => 0.5 * interval.getLength() * (interval.start + interval.end));
    const denominator = _.sumBy(intervals, (interval) => interval.getLength());
    return numerator / denominator;
}

function doLociTouchInGenome(locus1: ChromosomeInterval, locus2: ChromosomeInterval) {
    if (locus1.chr !== locus2.chr) {
        return false;
    }

    return locus1.end === locus2.start || locus2.end === locus1.start;
}
