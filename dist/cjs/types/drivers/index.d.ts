import { MQConst } from '../mq_const.js';
export declare namespace MQDriver {
    interface Option {
        alias: string;
        host: string;
        user: string;
        password: string;
        database: string;
        dateStrings?: boolean;
        checkDuplicate?: boolean;
        compress?: boolean;
        supportBigNumbers?: boolean;
        bigNumberStrings?: boolean;
        connectionLimit?: number;
    }
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
    function initialize(driver: string, options?: Object): Promise<any>;
    function create(type: MQConst.CONNECTION, driver: string, config?: Option | Option[]): Promise<MQDriver.Container>;
}
//# sourceMappingURL=index.d.ts.map