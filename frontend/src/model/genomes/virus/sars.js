import Chromosome from "../Chromosome";
import Genome from "../Genome";
import TrackModel from "../../TrackModel";

const genome = new Genome("SARS", [new Chromosome("NC_004718.3", 29751)]);

const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("NC_004718.3:0-29751");
const defaultTracks = [
    new TrackModel({
        type: "geneAnnotation",
        name: "ncbiGene",
        label: "NCBI genes",
        genome: "SARS",
    }),
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
    new TrackModel({
        type: "bedgraph",
        name: "GC Percentage",
        url: "https://vizhub.wustl.edu/public/virus/sars_CGpct.bedgraph.sort.gz",
    }),
    new TrackModel({
        type: "bedgraph",
        name: "Sequence Diversity (Shannon Entropy)",
        url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_entropy.bedgraph.sort.gz",
        options: {
            aggregateMethod: "MEAN",
            height: 50,
        },
    }),
    new TrackModel({
        type: "qbed",
        name: "Mutation Alert",
        url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_alert.bed.sort.gz",
        options: {
            height: 60,
            color: "darkgreen",
        },
    }),
];

const annotationTracks = {
    Ruler: [
        {
            type: "ruler",
            label: "Ruler",
            name: "Ruler",
        },
    ],
    Genes: [
        {
            name: "ncbiGene",
            label: "NCBI genes",
            filetype: "geneAnnotation",
        },
    ],
    Assembly: [
        {
            type: "bedgraph",
            name: "GC Percentage",
            url: "https://vizhub.wustl.edu/public/virus/sars_CGpct.bedgraph.sort.gz",
        },
    ],
    Diversity: [
        {
            type: "bedgraph",
            name: "Sequence Diversity (Shannon Entropy)",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_entropy.bedgraph.sort.gz",
            options: {
                aggregateMethod: "MEAN",
            },
        },
        {
            type: "qbed",
            name: "Mutation Alert",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_alert.bed.sort.gz",
        },
    ],
    "Genome Comparison": [
        {
            name: "nCoV2019tosars",
            label: "nCoV2019 to SARS alignment",
            querygenome: "nCoV2019",
            filetype: "genomealign",
            url: "https://vizhub.wustl.edu/public/virus/sars_ncov.genomealign.gz",
        },
        {
            name: "merstosars",
            label: "MERS to SARS alignment",
            querygenome: "MERS",
            filetype: "genomealign",
            url: "https://vizhub.wustl.edu/public/virus/sars_mers.genomealign.gz",
        },
    ],
};

const SARS = {
    genome: genome,
    navContext: navContext,
    cytobands: {},
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/virus/SARS.2bit",
    annotationTracks,
};

export default SARS;
