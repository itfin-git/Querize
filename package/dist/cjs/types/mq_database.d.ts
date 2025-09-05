import { MQDriver } from './drivers';
import { MQConst } from './mq_const.js';
import { MQQuery } from './mq_query.js';
export declare namespace MQDatabase {
    function getCOID(): number;
    function getConnectName(dbname?: string | null, dbmode?: string | null): string;
    class Class {
        readonly container: MQDriver.Container;
        readonly type: MQConst.CONNECTION;
        constructor(container: MQDriver.Container);
        transaction(dbname?: string, dbmode?: string): Promise<MQQuery.Class>;
        singleton(dbname?: string, dbmode?: string): Promise<MQQuery.Class>;
        commit(): void;
        rollback(): void;
        query(sql?: string | null): Promise<any> | MQQuery.Class;
        destroy(): Promise<any>;
    }
}
//# sourceMappingURL=mq_database.d.ts.map