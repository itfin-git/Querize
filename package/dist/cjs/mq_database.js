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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQDatabase = void 0;
const mq_trace_js_1 = require("./mq_trace.js");
const mq_const_js_1 = require("./mq_const.js");
const mq_query_js_1 = require("./mq_query.js");
var MQDatabase;
(function (MQDatabase) {
    var _cid = 0;
    function getCOID() {
        return ++_cid;
    }
    MQDatabase.getCOID = getCOID;
    function getConnectName(dbname, dbmode) {
        return ((dbname && `${dbname}.`) || '') + ((dbmode && `${dbmode}`) || '');
        ;
    }
    MQDatabase.getConnectName = getConnectName;
    class Class {
        constructor(container) {
            this.container = container;
            this.type = container.getType();
        }
        transaction(dbname, dbmode) {
            var self = this;
            return self.container.getConnection(dbname, dbmode)
                .then(function (connector) {
                if (dbname != null) {
                    return connector.query(`USE ${dbname}`).then(function () { return connector; });
                }
                return connector;
            })
                .then(function (connector) {
                mq_trace_js_1.MQTrace.log(`[C:${connector.getId()}] ${mq_const_js_1.MQConst.NAME[self.type]}-TRANSACTION: capture.`);
                return connector.beginTransaction().then(function () {
                    return new mq_query_js_1.MQQuery.Class(self, connector, {
                        operation: mq_const_js_1.MQConst.OPERATION.TRANSACTION,
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
        singleton(dbname, dbmode) {
            var self = this;
            return Promise.resolve().then(function () {
                // if( dbname == null || dbmode == null ) { throw new Error('singleton function: Database name, mode null error.'); }
                return new mq_query_js_1.MQQuery.Class(self, undefined, {
                    operation: mq_const_js_1.MQConst.OPERATION.SINGLETON,
                    dbname: dbname,
                    dbmode: dbmode,
                });
            });
        }
        commit() { throw new Error('commit use only transaction.'); }
        rollback() { throw new Error('rollback use only transaction.'); }
        query(sql) {
            var self = this;
            if (sql == null) {
                return new mq_query_js_1.MQQuery.Class(self, undefined, {
                    operation: mq_const_js_1.MQConst.OPERATION.SINGLETON,
                });
            }
            return self.container.getConnection().then(function (connector) {
                console.log("sql:", sql);
                return connector.query(sql).finally(function () {
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
            mq_trace_js_1.MQTrace.log(`Database destory.`);
            return this.container.destory();
        }
    }
    MQDatabase.Class = Class;
    ;
})(MQDatabase || (exports.MQDatabase = MQDatabase = {}));
;
//# sourceMappingURL=mq_database.js.map