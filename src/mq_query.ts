/*
* Querize.js v1.0.0
* Copyright (c) 2020 lClasser
* SPDX-License-Identifier: MIT
* @author lClasser
* @since 2020
* @see https://github.com/itfin/querize
* @license MIT
* @preserve
*/
'use strict';
import {MQDriver}   from './drivers';
import {MQTrace}    from './mq_trace.js';
import {MQConst}    from './mq_const.js';
// import {MQConnect}  from './_NOT_mq_connect.js';
import {MQWhere}    from './mq_where.js';
import {MQDatabase} from './mq_database.js';

export namespace MQQuery
{
    type QTColumn = {
        // schema: schema,
        alias: string,
        name : string,
        type : string,
        dml ?: string,
        keys?: string,
    };
    type QTables = { [key: string]: QTColumn };

    type QFroms = {
        tables      : QTables,
        select_expr ?: string, // select
        from_expr   ?: string,
        join_wheres : string, // inner 일 경우 key-match 를 where에 추가
    };
    type QEvent = {
        key         : string,
        val         : object,
    };

    export interface Config {
        operation : MQConst.OPERATION,
        dbname?: string,
        dbmode?: string,
    };
    export interface Insert {
        ignore?: boolean,
    };

    var _qid: number = 0;
    export class Class
    {
        owner       !: MQDatabase.Class;
        connector   ?: MQDriver.Connector;
        config      !: Config;

        dml         ?: string;
        tables      !: QTables;
        // unions      !: string;
        groups      ?: string[];
        orders      ?: string[];
        error       ?: Error;
        limit_pos   ?: number;
        limit_cnt   ?: number;
        onevent     ?: QEvent;

        qoid        !: number;
        literal     = MQWhere.literal; // function

        constructor(owner: MQDatabase.Class | MQQuery.Class, connector?: MQDriver.Connector, config?: Config) {
            if( owner instanceof MQQuery.Class ) {
                this.owner = owner.owner;
                this.connector = owner.connector;
                this.config = Object.assign({}, owner.config);
            }
            else {
                this.owner = owner;
                this.connector = connector;
                this.config = config || {
                    operation : MQConst.OPERATION.SINGLETON,
                    dbname : undefined,
                    dbmode : undefined,
                };
            }

            _qid++;
            this.qoid = _qid;
            this.#_reset();
        }

        #_reset() {
            var self = this;
            self.dml = undefined;
            self.tables = {};

            // self.unions = undefined;
            self.groups = undefined;
            self.orders = undefined;
            self.error = undefined;
            self.limit_pos = undefined;
            self.limit_cnt = undefined;
            self.onevent = undefined;
        }

        #_table(type: string, name: string, argv?: IArguments) {
            if( this.error != undefined ) {
                return this;
            }

            // var array: Array<any> = [];
            let array;
            if( argv != undefined && argv.length > 0 ) {
                array = Array.from(argv).slice(1);

                var xquery: MQQuery.Class | undefined = undefined;
                var xalias: string | undefined = undefined;
                var xkeys : Array<object> | undefined = undefined;

                var apos: number;
                var aitem: any;
                for( [apos, aitem] of array.entries() ) {
                // alias, MQuery, object(keys)
                    if( aitem instanceof MQQuery.Class ) { // subquery
                        xquery = aitem;
                    }
                    else
                    if( typeof aitem == 'string' ) { // alias
                        xalias = aitem;
                    }
                    else
                    if( typeof aitem == 'object' ) { // keys
                        xkeys = array.slice(apos);
                        break;
                    }
                }
            }
            // MQTrace.log(`[Q:${this.qoid}] ${type}:[${name}] [${xalias}]`);
            return this.error != undefined ? this : MQQuery._obj_table(this, type, name, xalias, xquery, xkeys);
        }

        execute(sql?: string) {
            var self = this;
            if( self.error ) {
                return Promise.reject(self.error);
            }
        
            const query = sql || self.dml;
            if( query == undefined ) {
                return Promise.reject('empty query to execute.');
            }

            self.#_reset();
            // once.singleton       : connect & close               : connector null
            // once.transaction     : connect & commit              : connector exist
            // once.persistent      : connect & (commit or close)   : connector (null or exist)
            // 
            // pool.singleton       : connect & release             : connector null
            // pool.transaction     : connect & commit              : connector exist
            // pool.persistent      : connect & (commit or close)   : connector (null or exist)

            // singleton or persistent
            if( self.connector == undefined ) {
                return self.owner.container.getConnection(self.config.dbname, self.config.dbmode)
                .then(function(connector) {
                    // 연속 실행시 중복 발생 가능 머저 연결된 connector을 사용한다.
                    if( self.connector != undefined ) {
                        connector.close();
                        connector = self.connector;
                    }

                    // singleton은 self.connector 가 항상 null 이다.
                    // MQTrace.log(`[C:${connector.getId()}] ${MQConst.NAME[self.owner.type]}-${MQConst.NAME[self.config.operation]}: query1:[${query}]`);
                    return connector.query(query).finally(function() {
                        // MQTrace.log(`[C:${connector.getId()}] ${MQConst.NAME[self.owner.type]}-${MQConst.NAME[self.config.operation]}: query1 finish.`);
                        switch( self.config.operation ) {
                        case MQConst.OPERATION.SINGLETON:
                            connector.close();
                            break;
                        case MQConst.OPERATION.PERSISTENT:
                            self.connector = connector;
                            break;
                        }
                    });
                });
            }

            // MQTrace.log(`[C:${self.connector.getId()}] ${MQConst.NAME[self.owner.type]}-${MQConst.NAME[self.config.operation]}: query2:[${query}]`);
            return self.connector.query(query);
        }

        table(name: string) { return new MQQuery.Class(this).#_table('table', name, arguments); }
        inner(name: string) { return this.#_table('inner', name, arguments); }
        left(name: string)  { return this.#_table('left' , name, arguments); }
        right(name: string) { return this.#_table('right', name, arguments); }

        on(onevent: string, values: any) {
            this.onevent = { key : onevent, val : values, };
            return this;
        }

        union() {
            this.error = new Error('not yet support');
            return this;
            /*
            var argv = Array.from(arguments);
            // console.log('argv:', argv);
            if( typeof(option) == 'string' ) {
                argv.shift();
            } else {
                option = undefined;
            }
            this.unions = Array.from(argv);
            return this;
            */
        }

        where() {
            return new MQWhere.Class(this, Array.from(arguments));
        }
        limit(pos?: number, cnt?: number) {
            if( this.error != undefined ) return this;
            if( cnt == undefined ) { cnt = pos; pos = undefined; }
            this.limit_pos = pos;
            this.limit_cnt = cnt;
            return this;
        }
        group_by(...fields: (string | string[])[]) {
            if( this.error != undefined ) return this;
            this.groups = fields.flat(Infinity)
                .filter(v => v !== undefined && v !== null)
                .map(v => String(v));
            return this;
        }
        order_by(...fields: (string | string[])[]) {
            if( this.error != undefined ) return this;
            this.orders = fields.flat(Infinity)
                .filter(v => v !== undefined && v !== null)
                .map(v => String(v));
            return this;
        }

        select(...fields: (string | string[])[]) { // fields is array
            if( this.error != undefined ) return this;
            const flats = fields.flat(Infinity)
                .filter(v => v !== undefined && v !== null)
                .map(v => String(v));
            this.dml = MQQuery._sql_select(this, flats);
            return this;
        }
        insert(fields: object, option: MQQuery.Insert) { // fields is object
            if( this.error == undefined ) this.dml = MQQuery._sql_insert(this, fields, option);
            return this;
        }
        delete() {
            return this.error != undefined ?  this : this.setError(new Error('delete need where.'));
        }
        update() { // fields is object
            return this.error != undefined ?  this : this.setError(new Error('update need where.'));
        }

        for_update() {
            if( this.error == undefined ) this.dml = this.dml + ` FOR UPDATE `;
            return this;
        }

        commit() {
            var self = this;
            if( self.connector == null ) return Promise.resolve();
            // MQTrace.log(`[C:${self.connector.getId()}] COMMIT.`);
            return self.connector.commit().then(function() {
                // MQTrace.log(`${MQConst.NAME[self.owner.type]}-${MQConst.NAME[self.config.operation]}: commit.`);
            });
        }
        rollback() {
            var self = this;
            if( self.connector == null ) return Promise.reject('loss connection for rollback.');
            // MQTrace.log(`[C:${self.connector.getId()}] ROLLBACK.`);
            return self.connector.rollback().then(function() {
                // MQTrace.log(`${MQConst.NAME[self.owner.type]}-${MQConst.NAME[self.config.operation]}: rollback.`);
            });
        }

        // lock 후 접속 해제 되면 자동 unlock 됨
        lock(name: string, timed?: number) {
            timed = timed || 30;
            MQTrace.log("QUERY: GET_LOCK");
            return this.execute(`SELECT GET_LOCK('lock_${name}', ${timed})\G`);
        }
        unlock(name: string) {
            MQTrace.log("QUERY: RELEASE_LOCK");
            return this.execute(`SELECT RELEASE_LOCK('lock_${name}')\G`);
        }

        setError(oerr: Error) {
            console.error("setError:", oerr);
            this.error = oerr;
            return this;
        }
    }

    export function _obj_table(squery: MQQuery.Class, type: string, name: string, xalias?: string, xquery?: MQQuery.Class, xkeys?: Array<object>) {
        let dml: string|undefined = undefined;
        let keys: string|undefined = undefined;
        let alias = xalias || name;

        // sub-query
        if( xquery ) {
            if( xquery.error != undefined ) {
                return squery.setError(xquery.error);
            }
            dml = xquery.dml;
        }

        switch( type ) {
        case 'table':
        case 'inner':
            break;
        default:
            if( type != undefined && xkeys == undefined ) {
                console.error('table key not defined.', type);
                return squery.setError(new Error(`table key not defined:${type}`));
            }
        }

        // check: table duplication
        if( squery.tables[alias] != undefined ) {
            return squery.setError(new Error(`table[${alias}] name duplicate.`));
        }

        // sub-query key
        if( xkeys != undefined ) {
            keys = MQWhere.way_where(xkeys);
        }

        squery.tables[alias] = {
            // schema: schema,
            alias: alias,
            name: name,
            type: type,
            dml: dml,
            keys: keys,
        };

        // inner,left,right,...
        return squery;
    }

    export function _sql_insert(squery: MQQuery.Class, fields: object, option: MQQuery.Insert = {}) {
        var updates = '';
        var inserts = '';
        var columns = '';

        // table
        var tbl_names = Object.keys(squery.tables);
        if( tbl_names == undefined || tbl_names.length <= 0 ) {
            squery.setError(new Error('insert table not exist.'));
            return undefined;
        }
        var table = squery.tables[ tbl_names[0] ].alias;

        // column & value
        for (const [col, val] of Object.entries(fields)) {
            if( val == undefined ) continue;
            if( columns.length > 0 ) columns += ",";
            columns += col;

            if( updates.length > 0 )
                updates += ",";
            updates += `${col}=${MQWhere.value(val)}`;

            if( inserts.length > 0 )
                inserts += ",";
            inserts += MQWhere.value(val);
        }
        if( columns.length <= 0 ) {
            squery.setError(new Error('insert column not exist.'));
            return undefined;
        }

        var sql = `INSERT ${option.ignore && 'IGNORE ' || ''}INTO ` + table + "(" + columns + ") VALUES (" + inserts + ") ";
        if( squery.onevent && squery.onevent.key ) {
            if( squery.onevent.val ) {
                // column & value
                var uemp = '';
                for (const [col, val] of Object.entries(squery.onevent.val)) {
                    if( val == undefined ) continue;
                    if( uemp.length > 0 )
                        uemp += ",";
                    uemp += `${col}=${MQWhere.value(val)}`;
                }
                if( uemp.length > 0 ) {
                    updates = uemp;
                }
            }
            sql += "ON " + squery.onevent.key + " KEY UPDATE " + updates;
        }
        return sql;
    }

    export function _sql_delete(squery: MQQuery.Class, mwhere: MQWhere.Class) {
        // table
        var tbl_names = Object.keys(squery.tables);
        if( tbl_names == undefined || tbl_names.length <= 0 ) {
            squery.setError(new Error('delete table not exist.'));
            return undefined;
        }

        // FROM : fields, table
        var sparam = {
            tables: squery.tables,
            from_expr: 'FROM ',
            join_wheres : '', // inner 일 경우 key-match 를 where에 추가
        };
        MQQuery._sub_froms(squery, sparam);

        // where
        var qry = '';
        if( mwhere.wheres.length > 0 )
            qry += " WHERE " + mwhere.wheres;

        if( qry == undefined || qry.length <= 0 ) {
            squery.setError(new Error('delete no where.'));
            return undefined;
        }

        var sql = `DELETE ` + sparam.from_expr + qry;
        return sql;
    }

    export function _sql_update(squery: MQQuery.Class, fields: object, mwhere?: MQWhere.Class) {
        var updates = '';
        var wheres = '';

        // table
        var tbl_names = Object.keys(squery.tables);
        if( tbl_names == undefined || tbl_names.length <= 0 ) {
            squery.setError(new Error('update table not exist.'));
            return undefined;
        }
        var table = squery.tables[ tbl_names[0] ].alias;

        // updates
        for( var [key,val] of Object.entries(fields)) {
            if( val == undefined )
                continue;
            if( updates.length > 0 ) 
                updates += ",";

            switch( val.toString().charAt(0) )
            {
            case '<':
            case '>':
            case '=':
                updates += `${key}${val} `;
                break;
            default:
                updates += `${key}=${MQWhere.value(val)} `;
                break;
            }
        }

        // where
        if( mwhere && mwhere.wheres.length > 0 ) {
            wheres += "WHERE " + mwhere.wheres;
        }

        if( wheres.length <= 0 ) {
            squery.setError(new Error('update no where.'));
            return undefined;
        }

        var qry = `UPDATE ${table} SET ` + updates + wheres;
        return qry;
    }

    export function _sub_froms(squery: MQQuery.Class, param: QFroms) {
        param.tables = param.tables || {};
        param.select_expr = param.select_expr || '';
        param.from_expr = param.from_expr || 'FROM ';
        param.join_wheres = param.join_wheres || '';

        // FROM : fields, table
        var tbl_names: string[] = Object.keys(param.tables);
        tbl_names.forEach(function(alias: string, idx: number) {
            var table = param.tables[alias];
            if( idx > 0 ) {
                param.select_expr += ", "

                switch( table.type ) {
                case 'left':
                case 'right':
                    param.from_expr += " ";
                    break;
                default:
                    param.from_expr += ", ";
                    break;
                }
            }

            var sub_qry = table.name;
            // console.log("table:", table);
            if( table.dml != undefined ) {
                sub_qry = `(${table.dml})`;
            }

            if( tbl_names.length > 1 ) {
                param.select_expr += `${alias}.* `;
                switch( table.type ) {
                case 'left':
                    param.from_expr += `LEFT OUTER JOIN ${sub_qry} AS ${alias} `;
                    if( table.keys && table.keys.length > 0 )
                        param.from_expr += `ON ${table.keys}`;
                    break;
                case 'right':
                    param.from_expr += `RIGHT OUTER JOIN ${sub_qry} AS ${alias} `;
                    if( table.keys && table.keys.length > 0 )
                        param.from_expr += `ON ${table.keys}`;
                    break;
                case 'inner':
                default:
                    if( table.dml == undefined && alias == table.name )
                        param.from_expr += `${alias} `;
                    else
                        param.from_expr += `${sub_qry} AS ${alias} `;
                    if( table.keys && table.keys.length > 0 ) {
                        if( param.join_wheres.length > 0 )
                            param.join_wheres += "AND ";
                        param.join_wheres += table.keys + " ";
                    }
                    break;
                }
            }
            else {
                param.select_expr += `* `;
                if( sub_qry == alias ) alias = '';
                if( table.dml != undefined ) {
                    param.from_expr += `${sub_qry} ${alias || ''}`;
                } else {
                    param.from_expr += `${sub_qry} ${alias || ''}`;
                }
            }
        });
    }

    export function _sql_select(squery: MQQuery.Class, fields: Array<string>, mwhere?: MQWhere.Class) {
        var qry = '';

        // FROM : fields, table
        var sparam: QFroms = {
            tables: squery.tables,
            join_wheres: '',
        };
        MQQuery._sub_froms(squery, sparam);

        // SELECT : re-declare fields
        if( fields != undefined && fields.length > 0 ) {
            sparam.select_expr = fields.map(str=>str.trim()).join(', ') + " ";
        }
        qry = "SELECT " + sparam.select_expr + sparam.from_expr;

        // WHERE
        var wheres = '';
        if( mwhere ) {
            if( mwhere.wheres.length > 0 )
                wheres = mwhere.wheres;
        }

        if( sparam.join_wheres.length > 0 || wheres.length > 0 ) {
            qry += " WHERE ";

            var where_and = "";
            if( sparam.join_wheres.length > 0 ) {
                qry += sparam.join_wheres;
                where_and = "AND ";
            }
            if( wheres.length > 0 ) {
                qry += where_and + wheres;
            }
        }

        // groups
        var groups = (squery.groups != undefined) ? squery.groups.join(', ') : '';
        if( groups.length > 0 ) qry += " GROUP BY " + groups;

        var orders = (squery.orders != undefined) ? squery.orders.join(', ') : '';
        if( orders.length > 0 ) qry += " ORDER BY " + orders;

        if( squery.limit_pos != undefined && squery.limit_cnt != undefined ) {
            qry += ` LIMIT ${squery.limit_pos},${squery.limit_cnt}`;
        }
        else
        if( squery.limit_cnt != undefined ) {
            qry += ` LIMIT ${squery.limit_cnt}`;
        }

        return qry;
    }
};
