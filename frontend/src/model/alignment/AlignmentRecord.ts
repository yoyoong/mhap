import Feature from '../Feature';
import ChromosomeInterval from '../interval/ChromosomeInterval';
import { GAP_CHAR } from './AlignmentStringUtils';

/**
 * A data container for a GenomeAlign record.
 * 
 * @author Daofeng Li
 */
export class AlignmentRecord extends Feature {
    /**
     * Constructs a new AlignmentRecord, given a record from genomealignment source
     *
     */
    queryLocus: ChromosomeInterval;
    targetSeq: string;
    querySeq: string;
    queryStrand: string;

    constructor(record: any) {
        const locus = new ChromosomeInterval(record.chr, record.start, record.end);
        super(record[3].id, locus, record.strand);

        const {chr, start, stop, strand, targetseq, queryseq} = record[3].genomealign;
        this.queryLocus = new ChromosomeInterval(chr, start, stop);
        this.querySeq = queryseq || '';
        this.targetSeq = targetseq || '';
        this.queryStrand = strand;
    }

    getIsReverseStrandQuery() {
        return this.queryStrand === GAP_CHAR;
    }
}

export default AlignmentRecord;
