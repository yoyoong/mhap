/**
 * Genome configurations.  By default, the import scripts will look for the genome data in a directory with the same
 * name as the genome name.  For example, since the hg19 config is named "hg19", the scripts will look for data in the
 * `hg19` directory.
 *
 * @author Daofeng Li
 */

const GENE_FILEDS = // The mapping from column names to field names in the database
    // 'id,chrom,strand,txStart,txEnd,cdsStart,cdsEnd,exonStarts,exonEnds,name,transcriptionClass,description';
    "chrom,txStart,txEnd,cdsStart,cdsEnd,strand,name,id,transcriptionClass,exonStarts,exonEnds,description";

const geneFieldsAndIndex = {
    fields: GENE_FILEDS,
    indexFields: [
        {
            // Used for gene name search
            id: 1,
            name: 1,
        },
        {
            // Used for gene locus search
            chrom: 1,
            txStart: 1,
            txEnd: 1,
        },
    ],
};

const hg19 = [
    {
        name: "refGene",
        file: "HG19_RefSeq_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeV29",
        file: "gencode.v29lift37.hg19.annotation_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeV29Basic",
        file: "gencode.v29lift37.hg19.basic.annotation_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeV39",
        file: "gencodeV39lift37_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const hg38 = [
    {
        name: "refGene",
        file: "HG38_RefSeq_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeV29",
        file: "gencode.v29.hg38.annotation_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeV29Basic",
        file: "gencode.v29.hg38.basic.annotation_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "MANE_select_1.0",
        file: "mane_select_v1.0.hg38.refbed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "Ensembl_GRCh38_94",
        file: "Homo_sapiens.GRCh38.94.chr_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeV39",
        file: "gencodeV39_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const panTro5 = [
    {
        name: "refGene",
        file: "panTro5_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const panTro6 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const mm10 = [
    {
        name: "refGene",
        file: "MM10_RefSeq_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeM19",
        file: "gencode.vM19.annotation_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeM19Basic",
        file: "gencode.vM19.basic.annotation_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeCompVM25",
        file: "wgEncodeGencodeCompVM25_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const danRer10 = [
    {
        name: "refGene",
        file: "DANRER10_RefSeq_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "Ensembl_GRCz10_91",
        file: "Danio_rerio.GRCz10.91.chr_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const danRer11 = [
    {
        name: "refGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const rn6 = [
    {
        name: "refGene",
        file: "rn6_Gene.bed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const mm9 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const bosTau8 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const rheMac8 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const araTha1 = [
    {
        name: "gene",
        file: "tair10Gene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const galGal5 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];
const galGal6 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const dm6 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const ce11 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const sacCer3 = [
    {
        name: "sgdGene",
        file: "sgdGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "refGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const Pfal3D7 = [
    {
        name: "PlasmoDBGene",
        file: "PlasmoDB9Gene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const Creinhardtii506 = [
    {
        name: "PhytozomeGene",
        file: "Creinhardtii506_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const panTro4 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ensGene",
        file: "ensGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const calJac3 = [
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ensGene",
        file: "ensGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const calJac4 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const nomLeu3 = [
    {
        name: "ensGene",
        file: "ensGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const gorGor3 = [
    {
        name: "ensGene",
        file: "ensGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const papAnu2 = [
    {
        name: "ensGene",
        file: "ensGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const rheMac3 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const mm39 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "gencodeCompVM28",
        file: "wgEncodeGencodeCompVM28_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const hpv16 = [
    {
        name: "ncbiGene",
        file: "hpv16.refbed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const TbruceiTREU927 = [
    {
        name: "gene",
        file: "TriTrypDB-51_TbruceiTREU927.gff.refbed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const TbruceiLister427 = [
    {
        name: "gene",
        file: "TriTrypDB-51_TbruceiLister427_2018.gff.refbed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const xenTro10 = [
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const b_chiifu_v3 = [
    {
        name: "gene",
        file: "Brapa_genome_v3.0_genes.gff3.refbed",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const susScr11 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const susScr3 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const oviAri4 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const rheMac10 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const rn7 = [
    {
        name: "refGene",
        file: "refGene_load",
        fieldsConfig: geneFieldsAndIndex,
    },
    {
        name: "ncbiGene",
        file: "ncbiRefSeq_load",
        fieldsConfig: geneFieldsAndIndex,
    },
];

const genomeConfig = {
    hg19,
    mm10,
    danRer10,
    danRer11,
    hg38,
    panTro5,
    panTro6,
    rn6,
    mm9,
    bosTau8,
    araTha1,
    rheMac8,
    galGal5,
    galGal6,
    ce11,
    sacCer3,
    Pfal3D7,
    dm6,
    Creinhardtii506,
    panTro4,
    calJac3,
    nomLeu3,
    gorGor3,
    papAnu2,
    rheMac3,
    mm39,
    hpv16,
    TbruceiTREU927,
    TbruceiLister427,
    xenTro10,
    b_chiifu_v3,
    susScr11,
    oviAri4,
    susScr3,
    rheMac10,
    calJac4,
    rn7,
};

module.exports = genomeConfig;
