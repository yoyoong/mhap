import DataSource from './DataSource';
import { SequenceData } from '../model/SequenceData';
import { TwoBitFile } from '@gmod/twobit';
import { RemoteFile } from 'generic-filehandle';

/**
 * Reads and gets data from remotely-hosted .2bit files.
 * 
 * @author Daofeng Li
 */
class TwoBitSource extends DataSource {
    /**
     * Prepares to fetch .2bit data from a URL.
     * 
     * @param {string} url - the URL from which to fetch data
     */
    constructor(url) {
        super();
        this.url = url;
        this.twobit = new TwoBitFile({ 
            filehandle: new RemoteFile(url)
        });
    }

    /**
     * Gets the sequence that covers the region.
     * 
     * @param {DisplayedRegionModel} region - region for which to fetch data
     * @return {Promise<SequenceData[]>} - sequence in the region
     */
    async getData(region) {
        const promises = region.getGenomeIntervals().map(async locus => {
            const sequence = await this.getSequenceInInterval(locus);
            return new SequenceData(locus, sequence);
        });
        return Promise.all(promises);
    }

    /**
     * Gets the sequence for a single chromosome interval.
     * 
     * @param {ChromosomeInterval} interval - coordinates
     * @return {Promise<string>} - a Promise for the sequence
     */
    async getSequenceInInterval(interval) {
        const seq = await this.twobit.getSequence(interval.chr, interval.start, interval.end);
        return seq;
    }

}

export default TwoBitSource;


// previous version
// import twoBit from '../vendor/bbi-js/main/twoBit';
// import bin from '../vendor/bbi-js/utils/bin';

// /**
//  * Reads and gets data from remotely-hosted .2bit files.
//  * 
//  * @author Daofeng Li
//  */
// class TwoBitSource extends DataSource {
//     /**
//      * Prepares to fetch .2bit data from a URL.
//      * 
//      * @param {string} url - the URL from which to fetch data
//      */
//     constructor(url) {
//         super();
//         this.url = url;
//         this.twoBitPromise = new Promise((resolve, reject) => {
//             twoBit.makeTwoBit(new bin.URLFetchable(url), (twoBitObj, error) => {
//                 if (error) {
//                     reject(error);
//                 }
//                 resolve(twoBitObj);
//             });
//         });
//     }

//     /**
//      * Gets the sequence that covers the region.
//      * 
//      * @param {DisplayedRegionModel} region - region for which to fetch data
//      * @return {Promise<SequenceData[]>} - sequence in the region
//      */
//     async getData(region) {
//         const promises = region.getGenomeIntervals().map(async locus => {
//             const sequence = await this.getSequenceInInterval(locus);
//             return new SequenceData(locus, sequence);
//         });
//         return Promise.all(promises);
//     }

//     /**
//      * Gets the sequence for a single chromosome interval.
//      * 
//      * @param {ChromosomeInterval} interval - coordinates
//      * @return {Promise<string>} - a Promise for the sequence
//      */
//     async getSequenceInInterval(interval) {
//         const twoBitObj = await this.twoBitPromise;
//         return new Promise((resolve, reject) => {
//             // bbi-js assumes coordinates are 1-indexed, while our coordinates are 0-indexed.  +1 to compensate.
//             twoBitObj.fetch(interval.chr, interval.start + 1, interval.end, (data, error) => {
//                 if (error) {
//                     reject(error);
//                 } else {
//                     resolve(data);
//                 }
//             });
//         });
//     }

// }
