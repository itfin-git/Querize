import { MQDriver } from './index';
import { MQConst } from '../mq_const.js';
import NodeMaria from 'mariadb';
export declare namespace DrvMariaDB {
    type TypeContainer = NodeMaria.Connection | NodeMaria.Pool | NodeMaria.PoolCluster;
    type TypeConnect = NodeMaria.Connection | NodeMaria.PoolConnection;
    export function create(type: MQConst.CONNECTION, config: MQDriver.Option | MQDriver.Option[]): Promise<Container>;
    export class Container implements MQDriver.Container {
        pool: TypeContainer | null;
        type: MQConst.CONNECTION;
        config?: MQDriver.Option | MQDriver.Option[];
        constructor(pool: TypeContainer | null, type: MQConst.CONNECTION, config?: MQDriver.Option | MQDriver.Option[]);
        getType(): MQConst.CONNECTION;
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>;
        destory(): Promise<void>;
    }
    export class Connector implements MQDriver.Connector {
        readonly owner: MQDriver.Container;
        readonly conn: TypeConnect;
        coid: number;
        constructor(owner: any, conn: TypeConnect);
        getId(): string;
        beginTransaction(): Promise<any>;
        query(sql: string): Promise<any>;
        commit(): Promise<any>;
        rollback(): Promise<any>;
        close(): Promise<any>;
    }
    export {};
}
//# sourceMappingURL=drv_mariadb.d.ts.map