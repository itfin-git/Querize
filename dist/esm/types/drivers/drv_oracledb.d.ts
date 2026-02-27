import { MQDriver } from './index';
import { MQConst } from '../mq_const.js';
import OracleDB from 'oracledb';
export declare namespace DrvOracleDB {
    type TypeContainer = OracleDB.Connection | OracleDB.Pool;
    type TypeConnect = OracleDB.Connection;
    export function generateConfig(type?: string): {
        libDir: string;
        configDir: string;
        errorUrl: string;
        driverName: string;
        alias?: undefined;
        connectString?: undefined;
        user?: undefined;
        password?: undefined;
        poolMax?: undefined;
        poolMin?: undefined;
        poolIncrement?: undefined;
        poolTimeout?: undefined;
        poolPingInterval?: undefined;
    } | {
        alias: string;
        connectString: string;
        user: string;
        password: string;
        poolMax: number;
        poolMin: number;
        poolIncrement: number;
        poolTimeout: number;
        poolPingInterval: number;
        libDir?: undefined;
        configDir?: undefined;
        errorUrl?: undefined;
        driverName?: undefined;
    };
    export function initialize(options?: OracleDB.InitialiseOptions): Promise<any>;
    export function create(type: MQConst.CONNECTION, config: any, option?: any): Promise<Container>;
    export class Container implements MQDriver.Container {
        pool: TypeContainer | null;
        pools: TypeContainer[] | null;
        type: MQConst.CONNECTION;
        config?: any;
        dbname?: string;
        constructor(pool: TypeContainer | TypeContainer[] | null, type: MQConst.CONNECTION, config?: any);
        getType(): MQConst.CONNECTION;
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>;
        destory(): Promise<any>;
        setDefaultDatabase(dbname: string): void;
    }
    export class Connector implements MQDriver.Connector {
        readonly owner: MQDriver.Container;
        readonly conn: TypeConnect;
        isTR: Boolean;
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
//# sourceMappingURL=drv_oracledb.d.ts.map