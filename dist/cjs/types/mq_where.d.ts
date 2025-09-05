import { MQQuery } from './mq_query.js';
export declare namespace MQWhere {
    function literal(val: string): object;
    function value(val: any): any;
    function expression(val: any): string;
    function way_array(argv: Array<object>): string;
    function way_object(argv: object | MQWhere.Class): string;
    function way_where(values?: Array<object>): string;
    class Class {
        readonly owner: MQQuery.Class;
        wheres: string;
        constructor(owner: MQQuery.Class, values: Array<object>);
        and(): this;
        or(): this;
        order_by(): this;
        group_by(): this;
        limit(pos?: number, cnt?: number): this;
        select(...fields: (string | string[])[]): MQQuery.Class;
        insert(): MQQuery.Class;
        insert_ignore(): MQQuery.Class;
        delete(): MQQuery.Class;
        update(fields: object): MQQuery.Class;
        execute(): Promise<never>;
    }
}
//# sourceMappingURL=mq_where.d.ts.map