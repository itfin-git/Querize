import { MQDriver } from './index';
import { MQConst } from '../mq_const.js';
export declare namespace DrvQuery {
    function create(type: MQConst.CONNECTION, config: any, option?: any): Promise<Container>;
    class Container implements MQDriver.Container {
        type: MQConst.CONNECTION;
        constructor(type: MQConst.CONNECTION);
        getType(): MQConst.CONNECTION;
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>;
        destory(): Promise<any>;
    }
    class Connector implements MQDriver.Connector {
        readonly owner: Container;
        coid: number;
        constructor(owner: Container);
        getId(): string;
        beginTransaction(): Promise<any>;
        query(sql: string): Promise<any>;
        commit(): Promise<any>;
        rollback(): Promise<any>;
        close(): Promise<any>;
    }
}
//# sourceMappingURL=drv_query.d.ts.map