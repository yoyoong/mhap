import { AnnotationTrackConfig } from "./AnnotationTrackConfig";
import { ProteinTrack } from "../trackVis/proteinTrack/ProteinTrack";

import WorkerSource from "../../dataSources/worker/WorkerSource";
import { BedWorker } from "../../dataSources/WorkerTSHook";
import BedRecord from "../../dataSources/bed/BedRecord";
import Feature from "../../model/Feature";
import ChromosomeInterval from "../../model/interval/ChromosomeInterval";
import LocalBedSource from "../../dataSources/LocalBedSource";
import BedTextSource from "../../dataSources/BedTextSource";
import HiddenPixelsConfig from "../trackContextMenu/HiddenPixelsConfig";

export class ProteinTrackConfig extends AnnotationTrackConfig {
  initDataSource() {
    if (this.trackModel.isText) {
      return new BedTextSource({
        url: this.trackModel.url,
        blob: this.trackModel.fileObj,
        textConfig: this.trackModel.textConfig
      });
    } else {
      if (this.trackModel.files.length > 0) {
        return new LocalBedSource(this.trackModel.files);
      } else {
        return new WorkerSource(BedWorker, this.trackModel.url);
      }
    }
  }

  /**
   * Converts BedRecords to Features.
   *
   * @param {BedRecord[]} data - bed records to convert
   * @return {Feature[]} bed records in the form of Feature
   */
  formatData(data: BedRecord[]) {
    return data.map(
      record =>
        new Feature(
          "",
          new ChromosomeInterval(record.chr, record.start, record.end),
          record[3]
        )
    );
  }

  getComponent() {
    return ProteinTrack;
  }

  getMenuComponents() {
    return [...super.getMenuComponents(), HiddenPixelsConfig];
  }
}
