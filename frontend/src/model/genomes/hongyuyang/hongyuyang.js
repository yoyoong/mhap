import Chromosome from '../Chromosome';
import Genome from '../Genome';
import TrackModel from '../../TrackModel';

import annotationTracks from "./annotationTracks.json";
import chromSize from "./chromSize.json";

const allSize = chromSize.map(genom => new Chromosome(genom.chr, genom.size));
const genome = new Genome("hongyuyang", allSize);
const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("chr6:52341786-52427411");
const defaultTracks = [
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
    new TrackModel({
        type: "geneAnnotation",
        name: "hongyuyang",
        genome: "hongyuyang",
    }),
    new TrackModel({
        type: "bigwig",
        name: "gc5Base",
        url: 'https://egg.wustl.edu/d/mm10/gc5Base.bigWig',
    }),
    new TrackModel({
        type: "bigwig",
        name: "test bigwig",
        url: "https://github.com/yoyoong/mhap/blob/main/SRX5724431_a.bw",
    }),
    new TrackModel({
        type: 'bigwig',
        name: '273_treat',
        genome: "hongyuyang",
    })
];

const hongyuyang = {
    genome: genome,
    navContext: navContext,
    cytobands: {},
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/gorGor3/gorGor3.2bit",
    annotationTracks,
};

export default hongyuyang;
