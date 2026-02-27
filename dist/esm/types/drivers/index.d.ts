import { MQConst } from '../mq_const.js';
export declare namespace MQDriver {
    interface Container {
        getType(): MQConst.CONNECTION;
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>;
        destory(): Promise<any>;
    }
    interface Connector {
        getId: () => string;
        beginTransaction: () => Promise<any>;
        commit: () => Promise<any>;
        rollback: () => Promise<any>;
        query: (sql: string) => Promise<any>;
        close: () => Promise<any>;
    }
    interface ResultSet {
        insertId?: any;
        affected: number;
        rows: any[];
        meta: any;
        isEmpty(): boolean;
    }
    function invokeFunction(driver: string, name: string, args?: any): Promise<any>;
    function create(type: MQConst.CONNECTION, driver: string, config?: any, option?: any): Promise<MQDriver.Container>;
}
//# sourceMappingURL=index.d.ts.map