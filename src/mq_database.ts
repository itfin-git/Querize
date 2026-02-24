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
import {MQQuery}    from './mq_query.js';

export namespace MQDatabase
{
    var _cid: number = 0;
    export function getCOID() {
        return ++_cid;
    }
    export function getConnectName(dbname?: string | null, dbmode?: string | null) {
        return ((dbname && `${dbname}.`) || '') + ((dbmode && `${dbmode}`) || '');;
    }
    export class Class {
        public readonly container!: MQDriver.Container;
        public readonly type!: MQConst.CONNECTION;

        constructor(container: MQDriver.Container) {
            this.container = container;
            this.type = container.getType();
        }

        transaction(dbname?: string, dbmode?: string): Promise<MQQuery.Class> {
            var self = this;
            return self.container.getConnection(dbname, dbmode).then(function(connector) {
                MQTrace.log(`[C:${connector.getId()}] ${MQConst.NAME[self.type]}-TRANSACTION: capture.`);
                return connector.beginTransaction().then(function() {
                    return new MQQuery.Class(self, connector, {
                        operation : MQConst.OPERATION.TRANSACTION,
                        dbname: dbname,
                        dbmode: dbmode,
                    });
                });
            });
        }

        /* persistent(dbname?: string, dbmode?: string): Promise<MQQuery.Class>  {
            var self = this;
            return Promise.resolve().then(function() {
                // if( dbname == null || dbmode == null ) { throw new Error('singleton function: Database name, mode null error.'); }
                return new MQQuery.Class(self, undefined, {
                    operation : MQConst.OPERATION.PERSISTENT,
                    dbname: dbname,
                    dbmode: dbmode,
                });
            });
        } */
       
        singleton(dbname?: string, dbmode?: string): Promise<MQQuery.Class>  {
            var self = this;
            return Promise.resolve().then(function() {
                // if( dbname == null || dbmode == null ) { throw new Error('singleton function: Database name, mode null error.'); }
                return new MQQuery.Class(self, undefined, {
                    operation : MQConst.OPERATION.SINGLETON,
                    dbname: dbname,
                    dbmode: dbmode,
                });
            });
        }

        commit() { throw new Error('commit use only transaction.'); }
        rollback() { throw new Error('rollback use only transaction.'); }

        query(sql?: string | null) {
            var self = this;
            if( sql == null ) {
                return new MQQuery.Class(self, undefined, {
                    operation : MQConst.OPERATION.SINGLETON,
                });
            }
            return self.container.getConnection().then(function(connector) {
                console.log("sql:", sql);
                return connector.query(sql).finally(function() {
                    connector.close();
                });
            });
        }

        /* // MQQuery를 통해 사용한다.
        table(name, alias) {
            var query = new MQQuery(this);
            return query.table(name, alias);
        }
        lock(name, timed) {
            timed = timed || 30;
            return this.query(`SELECT GET_LOCK('lock_${name}', ${timed})\G`)
        }
        unlock(name) {
            return this.query(`SELECT RELEASE_LOCK('lock_${name}')\G`)
        } */

        destroy() {
            MQTrace.log(`Database destory.`);
            return this.container.destory();
        }
    };
};
