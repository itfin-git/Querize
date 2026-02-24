import { MQDriver } from './drivers/index.js';
import { MQDatabase } from './mq_database.js';
type MQOption = MQDriver.Option;
export declare class Querize {
    driver: string;
    constructor(driver: string, doptions: object);
    initialize(options?: Object): Promise<any>;
    createQuery(): Promise<MQDatabase.Class>;
    createConnect(option: MQOption | MQOption[]): Promise<MQDatabase.Class>;
    createPool(option: MQOption | MQOption[]): Promise<MQDatabase.Class>;
    createCluster(option: MQOption | MQOption[]): Promise<MQDatabase.Class>;
    static setTrace(callback: Function): void;
}
export declare function setTrace(callback: Function): void;
export default Querize;
//# sourceMappingURL=querize.d.ts.map