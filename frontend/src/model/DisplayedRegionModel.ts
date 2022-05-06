import OpenInterval from './interval/OpenInterval';
import NavigationContext from './NavigationContext';
import { FeatureSegment } from './interval/FeatureSegment';
import ChromosomeInterval from './interval/ChromosomeInterval';

/**
 * Index bases starting from 0.  Changing this will probably break a lot of things, as a lot of the code assumes
 * 0-indexing.
 */
const MIN_BASE = 0;

/**
 * Model that stores the view window/region in a larger navigation context (e.g. a genome).  Internally stores the
 * region as an open interval of nav context coordinates (@see {@link NavigationContext}).
 *
 * @author Silas Hsu
 */
class DisplayedRegionModel {
    private _navContext: NavigationContext;
    private _startBase: number;
    private _endBase: number;

    /**
     * Makes a new instance with specified navigation context, and optionally, initial view region.  If not specified,
     * the view region will be the entire navigation context.
     *
     * @param {NavigationContext} navContext - the context in which navigation will take place
     * @param {number} [start] - initial start of the view region
     * @param {number} [end] - initial end of the view region
     */
    constructor(navContext: NavigationContext, start=MIN_BASE, end?: number) {
        this._navContext = navContext;
        if (end === undefined) {
            end = navContext.getTotalBases();
        }
        this.setRegion(start, end); // Sets this._startBase and this._endBase
    }

    /**
     * Makes copy of this object such that no methods on the copy will modify the original.
     * 
     * @return {DisplayedRegionModel} a copy of this object
     */
    clone(): DisplayedRegionModel {
        return new DisplayedRegionModel(this._navContext, this._startBase, this._endBase);
    }

    /**
     * @return {NavigationContext} the navigation context with which this object was created
     */
    getNavigationContext(): NavigationContext {
        return this._navContext;
    }

    /**
     * @return {number} the current width of the view, in base pairs
     */
    getWidth(): number {
        return this._endBase - this._startBase;
    }

    /**
     * Gets a copy of the internally stored 0-indexed open interval that represents this displayed region.
     *
     * @return {OpenInterval} copy of the internally stored region
     */
    getContextCoordinates(): OpenInterval {
        return new OpenInterval(this._startBase, this._endBase);
    }

    /**
     * Gets the features that overlap this view region in the navigation context.
     * 
     * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
     * @return {FeatureSegment[]} list of feature intervals that overlap this view region
     */
    getFeatureSegments(includeGaps=true): FeatureSegment[] {
        return this._navContext.getFeaturesInInterval(this._startBase, this._endBase, includeGaps);
    }

    /**
     * Gets the genomic locations that overlap this view region.  The results are guaranteed to not overlap each other.
     * 
     * @return {ChromosomeInterval[]} list of genomic locations that overlap this view region.
     */
    getGenomeIntervals(): ChromosomeInterval[] {
        return this._navContext.getLociInInterval(this._startBase, this._endBase);
    }

    /**
     * Safely sets the internal display interval, ensuring that it stays within the navigation context and makes sense.
     * `start` and `end` should express a 0-indexed open interval of base numbers, [start, end).  This method will try
     * to preserve the input length as much as possible.
     * 
     * Errors if given a nonsensical interval, but does not error for intervals outside the navigation context.
     * 
     * Returns this.
     *
     * @param {number} start - the (inclusive) start of the region interval as a base pair number
     * @param {number} end - the (exclusive) end of the region interval as a base pair number
     * @return {this}
     * @throws {RangeError} if end is less than start, or the inputs are undefined/infinite
     */
    setRegion(start: number, end: number): this {
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            throw new RangeError("Start and end must be well-defined");
        }
        if (end < start) {
            throw new RangeError("Start must be less than or equal to end");
        }

        const newLength = end - start;
        const navigableLength = this._navContext.getTotalBases();
        if (start < MIN_BASE) { // Left cut off; we need to extend right side
            end = MIN_BASE + newLength;
        } else if (end > navigableLength) { // Ditto for right
            start = navigableLength - newLength;
        }

        this._startBase = Math.round(Math.max(MIN_BASE, start));
        this._endBase = Math.round(Math.min(end, navigableLength));
        return this;
    }

    /**
     * Pans the current region by a constant number of bases, also ensuring view boundaries stay within the genome.
     * Negative numbers pull regions on the left into view (=pan right); positive numbers pull regions on the right into
     * view (=pan left).
     * 
     * Returns `this`.
     *
     * @param {number} numBases - number of base pairs to pan
     * @return {this}
     */
    pan(numBases: number): this {
        this.setRegion(this._startBase + numBases, this._endBase + numBases);
        return this;
    }

    /**
     * pan same width to left, pan left not same as drag left, coords get smaller
     * @return {this}
     */
    panLeft(): this {
        const width = this.getWidth();
        return this.pan(-width);
    }

    /**
     * pan same width to right
     * @return {this}
     */
    panRight(): this {
        const width = this.getWidth();
        return this.pan(width);
    }

    /**
     * Multiplies the size of the current region by a factor, also ensuring view boundaries stay within the genome.
     * Factors less than 1 zoom in (region gets shorter); factors greater than 1 zoom out (region gets longer).
     * Additionally, one can specify the focal point of the zoom as the number of region widths from the left edge.  By
     * default this is 0.5, which is the center of the region.
     *
     * Note that due to rounding, zoom() is approximate; a zoom(2) followed by a zoom(0.5) may still change the region
     * boundaries by a base or two.
     * 
     * Returns `this`.
     *
     * @param {number} factor - number by which to multiply this region's width
     * @param {number} [focalPoint] - (optional) measured as number of region widths from the left edge.  Default: 0.5
     * @return {this}
     */
    zoom(factor: number, focalPoint=0.5): this {
        if (factor <= 0) {
            throw new RangeError("Zoom factor must be greater than 0");
        }

        const newWidth = this.getWidth() * factor;
        const focalBase = this.getWidth() * focalPoint + this._startBase;
        const newFocalBase = newWidth * focalPoint + this._startBase;
        const panAmount = focalBase - newFocalBase;

        // Raw start and end: not rounded or checked to be within the genome
        const rawStart = this._startBase + panAmount;
        const rawEnd = this._startBase + newWidth + panAmount;

        this.setRegion(rawStart, rawEnd);
        return this;
    }


        /**
     * @return {string} the currently displayed region in human-readable form
     */
    currentRegionAsString(): string {
        const segments = this.getFeatureSegments();
        if (segments.length === 1) {
            return segments[0].toString();
        } else {
            const first = segments[0];
            const last = segments[segments.length - 1];
            return first.toStringWithOther(last);
        }
    }

    /**
     * @return {string} the displayed region according to custom start/end
     * @param start the custom start of the region
     * @param end the custom end of the region
     */
    customRegionAsString(start: number, end: number): string {
        const segments = this._navContext.getFeaturesInInterval(start, end, true);
        if (segments.length === 1) {
            return segments[0].toString();
        } else {
            const first = segments[0];
            const last = segments[segments.length - 1];
            return first.toStringWithOther(last);
        }
    }
}

export default DisplayedRegionModel;
