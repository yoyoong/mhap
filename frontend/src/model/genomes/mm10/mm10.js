import Chromosome from "../Chromosome";
import Genome from "../Genome";
import TrackModel from "../../TrackModel";
import cytobands from "./cytoBand.json";
import annotationTracks from "./annotationTracks.json";

const genome = new Genome("mm10", [
    new Chromosome("chr1", 195471971),
    new Chromosome("chr2", 182113224),
    new Chromosome("chr3", 160039680),
    new Chromosome("chr4", 156508116),
    new Chromosome("chr5", 151834684),
    new Chromosome("chr6", 149736546),
    new Chromosome("chr7", 145441459),
    new Chromosome("chr8", 129401213),
    new Chromosome("chr9", 124595110),
    new Chromosome("chr10", 130694993),
    new Chromosome("chr11", 122082543),
    new Chromosome("chr12", 120129022),
    new Chromosome("chr13", 120421639),
    new Chromosome("chr14", 124902244),
    new Chromosome("chr15", 104043685),
    new Chromosome("chr16", 98207768),
    new Chromosome("chr17", 94987271),
    new Chromosome("chr18", 90702639),
    new Chromosome("chr19", 61431566),
    new Chromosome("chrX", 171031299),
    new Chromosome("chrY", 91744698),
    new Chromosome("chrM", 16299),
]);

const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("chr6:52149465-52164219");
const defaultTracks = [
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
    new TrackModel({
        type: "geneAnnotation",
        name: "refGene",
        genome: "mm10",
    }),
    // new TrackModel({
    //     type: "geneAnnotation",
    //     name: "gencodeM19",
    //     genome: "mm10",
    // }),
    new TrackModel({
        type: "geneAnnotation",
        name: "gencodeCompVM25",
        genome: "mm10",
    }),
    // new TrackModel({
    //     type: "longrange",
    //     name: "ES-E14 ChIA-PET",
    //     url: "https://egg.wustl.edu/d/mm9/GSE28247_st3c.gz",
    // }),
    // new TrackModel({
    //     type: "biginteract",
    //     name: "test bigInteract",
    //     url: "https://epgg-test.wustl.edu/dli/long-range-test/interactExample3.inter.bb",
    // }),
    new TrackModel({
        type: "repeatmasker",
        name: "RepeatMasker",
        url: "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
    }),
    // new TrackModel({
    //     type: 'refbed',
    //     name: 'refGene in refbed',
    //     url: 'https://wangftp.wustl.edu/~rsears/FOR_DAOFENG/gencodeM18_load_basic_Gene.bed.gz',
    // }),
    // new TrackModel({
    //     type: 'cool',
    //     name: 'Cool Track',
    //     url: 'CQMd6V_cRw6iCI_-Unl3PQ'
    // }),
];

const publicHubData = {
    "4D Nucleome Network":
        "The 4D Nucleome Network aims to understand the principles underlying nuclear " +
        "organization in space and time, the role nuclear organization plays in gene expression and cellular function, " +
        "and how changes in nuclear organization affect normal development as well as various diseases.  The program is " +
        "developing novel tools to explore the dynamic nuclear architecture and its role in gene expression programs, " +
        "models to examine the relationship between nuclear organization and function, and reference maps of nuclear" +
        "architecture in a variety of cells and tissues as a community resource.",
    "Encyclopedia of DNA Elements (ENCODE)":
        "The Encyclopedia of DNA Elements (ENCODE) Consortium is an " +
        "international collaboration of research groups funded by the National Human Genome Research Institute " +
        "(NHGRI). The goal of ENCODE is to build a comprehensive parts list of functional elements in the human " +
        "genome, including elements that act at the protein and RNA levels, and regulatory elements that control " +
        "cells and circumstances in which a gene is active.",
    "Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription (TaRGET)":
        "The TaRGET(Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription) program is a research consortium funded by the National Institute of Environmental Health Sciences (NIEHS). The goal of the collaboration is to address the role of environmental exposures in disease pathogenesis as a function of epigenome perturbation, including understanding the environmental control of epigenetic mechanisms and assessing the utility of surrogate tissue analysis in mouse models of disease-relevant environmental exposures.",
    "3D structures": "3D stucure data collection",
    "Image collection":
        "Image data from the Image Data Resource (IDR) or 4DN. Images are mapped to genomic coordinates with annotation gene id or symbol.",
};

const publicHubList = [
    {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Mouse ENCODE",
        numTracks: 1616,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/mm10encode2015",
        description:
            "The Mouse ENCODE Consortium consisted of a number of Data Production Centers and made use of the human ENCODE Data Coordination Center (DCC) at the University of California, Santa Cruz (currently at Stanford University). Production Centers generally focused on different data types, including transcription     factor and polymerase occupancy, DNaseI hypersensitivity, histone modification, and RNA transcription.",
    },
    {
        collection: "4D Nucleome Network",
        name: "4DN datasets",
        numTracks: 670,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/4dn/4dn-GRCm38-July2021.json",
        description: {
            "hub built by": "Daofeng Li (dli23@wustl.edu)",
            "last update": "Jul 14 2021",
            "hub built notes": "metadata information are obtained directly from 4DN data portal",
        },
    },
    {
        collection: "Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription (TaRGET)",
        name: "Mouse TaRGET",
        numTracks: 965,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/20190130_TaRGET_datahub.json",
        description: {
            "hub built by": "Wanqing Shao (wanqingshao@wustl.edu)",
            "hub built date": "Jan 30 2019",
        },
    },
    {
        collection: "3D structures",
        name: "3D structures from Science 2018 Aug 31;361(6405):924-928",
        numTracks: 10,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/mm10/hub",
    },
    {
        collection: "3D structures",
        name: "3D structures from Nat Struct Mol Biol 2019 Apr;26(4):297-307",
        numTracks: 1227,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/mm10/GSE121791/hub",
    },
    {
        collection: "3D structures",
        name: "3D structures from Cell 2021 Feb 4;184(3):741-758.e17",
        numTracks: 9770,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/mm10/GSE162511/hub",
    },
    {
        collection: "Image collection",
        name: "4dn image data",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/imagetrack/mm10/4dn/mm10.json",
        description: {
            "hub built by": "Daofeng Li (dli23@wustl.edu)",
            "total number of images": 124,
            "hub built notes": "mixed image datasets for mm10 in 4dn",
        },
    },
    {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Mouse ENCODE from ENCODE data portal",
        numTracks: 13001,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/mm10_encode_mouse_bigwig_metadata_nov142018.json",
        description: {
            "hub built by": "Daofeng Li (dli23@wustl.edu)",
            "hub built date": "Nov 14 2018",
            "hub built notes":
                "metadata information are obtained directly from ENCODE data portal, track files are hosted by ENCODE data portal as well",
        },
    },
    {
        collection: "International Human Epigenome Consortium (IHEC) ",
        name: "International Human Epigenome Consortium (IHEC) epigenomic datasets",
        numTracks: 266,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/ihec-mm10-urls.json",
        description: {
            "hub built by": "Daofeng Li (dli23@wustl.edu)",
            "hub built date": "Nov 30 2018",
            "hub built notes": "track files are hosted by IHEC data portal",
        },
    },
    {
        collection: "HiC interaction from HiGlass",
        name: "HiC interaction from HiGlass",
        numTracks: 79,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~dli/eg-hubs/higlass/2019/mm10_cool.json",
    },
    // {
    //     collection: "Neural Epigenome Atlas",
    //     name: "Neural Epigenome Atlas (R. L. Sears et al, in prep)",
    //     numTracks: 76,
    //     oldHubFormat: false,
    //     url: "https://vizhub.wustl.edu/public/mm10/Neural_Epigenome_Atlas/Epigenome_Atlas_vizhub.json"
    // },
];

const MM10 = {
    genome: genome,
    navContext: navContext,
    cytobands: cytobands,
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/mm10/mm10.2bit",
    publicHubData,
    publicHubList,
    annotationTracks,
};

export default MM10;
