import { MQDriver } from './index';
import { MQConst } from '../mq_const.js';
import NodeMaria from 'mariadb';
export declare namespace DrvMariaDB {
    type TypeContainer = NodeMaria.Connection | NodeMaria.Pool | NodeMaria.PoolCluster;
    type TypeConnect = NodeMaria.Connection | NodeMaria.PoolConnection;
    export function generateConfig(): {
        alias: string;
        host: string;
        user: string;
        password: string;
        database: string;
        dateStrings: boolean;
        checkDuplicate: boolean;
        compress: boolean;
        supportBigNumbers: boolean;
        bigNumberStrings: boolean;
        connectionLimit: number;
    };
    export function create(type: MQConst.CONNECTION, config: any): Promise<Container>;
    export class Container implements MQDriver.Container {
        pool: TypeContainer | null;
        type: MQConst.CONNECTION;
        config?: any;
        constructor(pool: TypeContainer | null, type: MQConst.CONNECTION, config?: any);
        getType(): MQConst.CONNECTION;
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>;
        destory(): Promise<any>;
    }
    export class Connector implements MQDriver.Connector {
        readonly owner: MQDriver.Container;
        readonly conn: TypeConnect;
        coid: number;
        constructor(owner: any, conn: TypeConnect);
        getId(): string;
        beginTransaction(): Promise<any>;
        query(sql: string): Promise<MQDriver.ResultSet>;
        commit(): Promise<any>;
        rollback(): Promise<any>;
        close(): Promise<any>;
    }
    export {};
}
//# sourceMappingURL=drv_mariadb.d.ts.map