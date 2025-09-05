import { MQDriver } from './drivers';
import { MQConst } from './mq_const.js';
import { MQWhere } from './mq_where.js';
import { MQDatabase } from './mq_database.js';
export declare namespace MQQuery {
    type QTColumn = {
        alias: string;
        name: string;
        type: string;
        dml?: string;
        keys?: string;
    };
    type QTables = {
        [key: string]: QTColumn;
    };
    type QFroms = {
        tables: QTables;
        select_expr?: string;
        from_expr?: string;
        join_wheres: string;
    };
    type QEvent = {
        key: string;
        val: object;
    };
    export interface Config {
        operation: MQConst.OPERATION;
        dbname?: string;
        dbmode?: string;
    }
    export interface Insert {
        ignore?: boolean;
    }
    export class Class {
        #private;
        owner: MQDatabase.Class;
        connector?: MQDriver.Connector;
        config: Config;
        dml?: string;
        tables: QTables;
        groups?: string[];
        orders?: string[];
        error?: Error;
        limit_pos?: number;
        limit_cnt?: number;
        onevent?: QEvent;
        qoid: number;
        literal: typeof MQWhere.literal;
        constructor(owner: MQDatabase.Class | MQQuery.Class, connector?: MQDriver.Connector, config?: Config);
        execute(sql?: string): Promise<any>;
        table(name: string): Class;
        inner(name: string): Class;
        left(name: string): Class;
        right(name: string): Class;
        on(onevent: string, values: any): this;
        union(): this;
        where(): MQWhere.Class;
        limit(pos?: number, cnt?: number): this;
        group_by(...fields: (string | string[])[]): this;
        order_by(...fields: (string | string[])[]): this;
        select(...fields: (string | string[])[]): this;
        insert(fields: object, option: MQQuery.Insert): this;
        delete(): this;
        update(): this;
        for_update(): this;
        commit(): Promise<void>;
        rollback(): Promise<void>;
        lock(name: string, timed?: number): Promise<any>;
        unlock(name: string): Promise<any>;
        setError(oerr: Error): this;
    }
    export function _obj_table(squery: MQQuery.Class, type: string, name: string, xalias?: string, xquery?: MQQuery.Class, xkeys?: Array<object>): Class;
    export function _sql_insert(squery: MQQuery.Class, fields: object, option?: MQQuery.Insert): string | undefined;
    export function _sql_delete(squery: MQQuery.Class, mwhere: MQWhere.Class): string | undefined;
    export function _sql_update(squery: MQQuery.Class, fields: object, mwhere?: MQWhere.Class): string | undefined;
    export function _sub_froms(squery: MQQuery.Class, param: QFroms): void;
    export function _sql_select(squery: MQQuery.Class, fields: Array<string>, mwhere?: MQWhere.Class): string;
    export {};
}
//# sourceMappingURL=mq_query.d.ts.map