import Papa from 'papaparse';

/**
 * @author Daofeng Li
 * this script deal with text file input as track content, using Papa to initialize the content of input file
 */

class TextSource {
    constructor(config) {
        this.config = config;
        this.url = '';
        this.blob = null;
        if (config.blob) {
            this.blob = config.blob;
        }
        if (config.url) {
            this.url = config.url;
        }
    }

    processTextFile() {
        let config, src;
        if (this.url.length) {
            src = this.url;
            config = { download: true, skipEmptyLines: 'greedy', worker: this.config.textConfig.isFileHuge };
        } else if (this.blob) {
            src = this.blob;
            config = { skipEmptyLines: 'greedy', worker: this.config.textConfig.isFileHuge };
        } else {
            console.error('no data source for TextSource, abort...');
        }
        return new Promise((resolve, reject) => {
            Papa.parse(src, {
                config,
                error: (err, file) => {
                    console.error(err, file);
                    reject(err);
                },
                complete: results => {
                    // resolve(JSON.parse(results.data))
                    resolve(results);
                }
            });
        });
    }

    init = async () => {
        const textData = await this.processTextFile();
        // console.log(textData);
        return textData;
    };
}

export default TextSource;
