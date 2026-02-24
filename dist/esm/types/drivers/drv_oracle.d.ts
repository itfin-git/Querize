import { MQDriver } from './index';
import { MQConst } from '../mq_const.js';
import OracleDB from 'oracledb';
export declare namespace DrvOracleDB {
    type TypeContainer = OracleDB.Connection | OracleDB.Pool;
    type TypeConnect = OracleDB.Connection;
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
        istr: Boolean;
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
//# sourceMappingURL=drv_oracle.d.ts.map