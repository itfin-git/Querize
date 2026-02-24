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
import { MQConst } from '../mq_const.js';
import { MQTrace } from '../mq_trace.js';
import OracleDB from 'oracledb';
let _initialized = false;
function _initOnce() {
    if (_initialized)
        return;
    _initialized = true;
    console.log("ORACLEDB.initOracleClient");
    OracleDB.initOracleClient();
}
_initOnce();
export var DrvOracleDB;
(function (DrvOracleDB) {
    var _tid = 0;
    function create(type, config) {
        let toid = ++_tid;
        switch (type) {
            case MQConst.CONNECTION.CONNECTER:
                return Promise.resolve(new Container(null, MQConst.CONNECTION.CONNECTER, config));
                break;
            case MQConst.CONNECTION.POOLER:
                return OracleDB.createPool(config)
                    .then(function (Pool) { return new Container(Pool, MQConst.CONNECTION.POOLER); });
                break;
        }
        throw new Error(`unsupport type(${type}).`);
    }
    DrvOracleDB.create = create;
    class Container {
        pool;
        type;
        config;
        constructor(pool, type, config) {
            this.pool = pool;
            this.type = type;
            this.config = config;
        }
        getType() { return this.type; }
        getConnection(dbname, dbmode) {
            var self = this;
            switch (this.type) {
                case MQConst.CONNECTION.CONNECTER:
                    return OracleDB.getConnection(this.config).then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case MQConst.CONNECTION.POOLER:
                    return self.pool.getConnection()
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
            }
            return Promise.reject(new Error(`Unsupported connection type: ${self.type}`));
        }
        destory() {
            switch (this.type) {
                case MQConst.CONNECTION.PHONY:
                case MQConst.CONNECTION.CONNECTER:
                    break;
                case MQConst.CONNECTION.POOLER:
                    // Force close after 10 seconds if it does not shut down normally.
                    return this.pool.close(10);
            }
            return Promise.resolve();
        }
    }
    DrvOracleDB.Container = Container;
    var _cid = 0;
    class Connector {
        owner;
        conn;
        istr; // is-transaction
        coid;
        constructor(owner, conn) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;
            this.istr = false;
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        // 1. A transaction automatically starts when a DML(INSERT/UPDATE/DELETE/MERGE) statement is executed.
        // 2. Use SET TRANSACTION – this will be handled later as an argument to beginTransaction().
        beginTransaction() { this.istr = true; return Promise.resolve(); }
        query(sql) {
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            if (this.istr != true) {
                // Use autoCommit when not in a transaction-function.
                return this.conn.execute(sql, {}, { autoCommit: true });
            }
            return this.conn.execute(sql);
        }
        commit() {
            var self = this;
            self.istr = false;
            return self.conn.commit().then(function () { self.close(); });
        }
        rollback() {
            var self = this;
            self.istr = false;
            return self.conn.rollback().then(function () { self.close(); });
        }
        close() {
            var self = this;
            return Promise.resolve()
                .then(function () {
                switch (self.owner.getType()) {
                    case MQConst.CONNECTION.PHONY:
                        break;
                    case MQConst.CONNECTION.CONNECTER:
                        MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
                        self.conn.release();
                        break;
                    case MQConst.CONNECTION.POOLER:
                        MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                        self.conn.release();
                        break;
                }
            });
        }
    }
    DrvOracleDB.Connector = Connector;
    ;
})(DrvOracleDB || (DrvOracleDB = {}));
;
//# sourceMappingURL=drv_oracle.js.map