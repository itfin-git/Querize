import { MQDriver } from './index';
import { MQConst } from '../mq_const.js';
export declare namespace DrvQuery {
    function create(type: MQConst.CONNECTION, config: any): Promise<Container>;
    class Container implements MQDriver.Container {
        type: MQConst.CONNECTION;
        constructor(type: MQConst.CONNECTION);
        getType(): MQConst.CONNECTION;
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>;
        destory(): Promise<void>;
    }
    class Connector implements MQDriver.Connector {
        readonly owner: Container;
        coid: number;
        constructor(owner: Container);
        getId(): string;
        beginTransaction(): Promise<void>;
        query(sql: string): Promise<void>;
        commit(): Promise<void>;
        rollback(): Promise<void>;
        close(): Promise<void>;
    }
}
//# sourceMappingURL=drv_query.d.ts.map