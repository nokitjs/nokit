import { IoCLoader } from "../Loader";
import { IApplication } from "../Application/IApplication";
import { getControllerInfo } from "./controller";
import { getAllMappingInfos } from "./mapping";

export class ControllerLoader<T> extends IoCLoader<T> {
  public async load(app: IApplication) {
    await super.load(app);
    this.content.forEach(ctlType => {
      const ctlInfo = getControllerInfo(ctlType);
      const mappingInfos = getAllMappingInfos(ctlType);
      mappingInfos.forEach(mappingInfo => {
        
      });
    });
  }
}