import { MQDatabase } from './mq_database.js';
export declare class Querize {
    driver: string;
    constructor(driver: string, doptions: object);
    initialize(options?: Object): Promise<any>;
    generateConfig(type?: string): Promise<any>;
    createQuery(): Promise<MQDatabase.Class>;
    createConnect(config: any): Promise<MQDatabase.Class>;
    createPool(config: any, option?: any): Promise<MQDatabase.Class>;
    createCluster(config: any): Promise<MQDatabase.Class>;
    static setTrace(callback: Function): void;
}
export declare function setTrace(callback: Function): void;
export default Querize;
//# sourceMappingURL=querize.d.ts.map