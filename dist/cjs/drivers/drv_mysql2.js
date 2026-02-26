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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrvMySQL = void 0;
const mq_const_js_1 = require("../mq_const.js");
const mq_trace_js_1 = require("../mq_trace.js");
const promise_1 = __importDefault(require("mysql2/promise"));
var DrvMySQL;
(function (DrvMySQL) {
    function generateConfig() {
        return {
            alias: "local-mysql", // transaction,singleton 시 찾을 이름
            host: "127.0.0.1", // DB ip
            user: "mysql", // DB user
            password: "password", // DB password
            database: "test-db", // DB database
            dateStrings: true,
            checkDuplicate: false,
            compress: true,
            supportBigNumbers: true,
            bigNumberStrings: false,
            connectionLimit: 5,
        };
    }
    DrvMySQL.generateConfig = generateConfig;
    var _tid = 0;
    function create(type, config) {
        let toid = ++_tid;
        switch (type) {
            case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                return Promise.resolve(new Container(null, mq_const_js_1.MQConst.CONNECTION.CONNECTER, config));
                break;
            case mq_const_js_1.MQConst.CONNECTION.POOLER:
                return Promise.resolve(new Container(promise_1.default.createPool(config), mq_const_js_1.MQConst.CONNECTION.POOLER));
                break;
            case mq_const_js_1.MQConst.CONNECTION.CLUSTER:
                return Promise.resolve().then(function () {
                    let cluster = promise_1.default.createPoolCluster();
                    if (Array.isArray(config) != true) {
                        config = [config];
                    }
                    config.forEach(function (option) {
                        cluster.add(option.alias, option);
                    });
                    return new Container(cluster, mq_const_js_1.MQConst.CONNECTION.CLUSTER);
                });
                break;
        }
        throw new Error(`unsupport type(${type}).`);
    }
    DrvMySQL.create = create;
    class Container {
        constructor(pool, type, config) {
            this.pool = pool;
            this.type = type;
            this.config = config;
        }
        getType() { return this.type; }
        getConnection(dbname, dbmode) {
            let self = this;
            let next = null;
            switch (this.type) {
                case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                    next = promise_1.default.createConnection(this.config).then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case mq_const_js_1.MQConst.CONNECTION.POOLER:
                    next = self.pool.getConnection()
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case mq_const_js_1.MQConst.CONNECTION.CLUSTER:
                    const dbid = (`${dbname}.` || '') + (`${dbmode}` || '');
                    next = self.pool.getConnection(`${dbid}*`)
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
            }
            if (next) {
                return next.then(function (connector) {
                    if (dbname != null) {
                        return connector.query(`USE ${dbname}`).then(function () { return connector; });
                    }
                    return connector;
                });
            }
            return Promise.reject(new Error(`Unsupported connection type: ${self.type}`));
        }
        destory() {
            switch (this.type) {
                case mq_const_js_1.MQConst.CONNECTION.PHONY:
                case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                    break;
                case mq_const_js_1.MQConst.CONNECTION.POOLER:
                    return this.pool.end();
                case mq_const_js_1.MQConst.CONNECTION.CLUSTER:
                    return this.pool.end();
            }
            return Promise.resolve();
        }
    }
    DrvMySQL.Container = Container;
    var _cid = 0;
    class Connector {
        constructor(owner, conn) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;
            mq_trace_js_1.MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        beginTransaction() { return this.conn.beginTransaction(); }
        query(sql) {
            mq_trace_js_1.MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            return this.conn.query(sql).then(function (result) {
                // MariaDB는 [rows, fields] 형태 또는 ResultSetHeader 객체로 옴
                const data = Array.isArray(result) ? result[0] : result;
                if (Array.isArray(data)) {
                    return {
                        affected: 0,
                        rows: data,
                        meta: result
                    };
                }
                return {
                    affected: data.affectedRows || 0,
                    insertId: data.insertId,
                    rows: [],
                    meta: result
                };
            });
        }
        commit() {
            var self = this;
            return self.conn.commit().then(function () { self.close(); });
        }
        rollback() {
            var self = this;
            return self.conn.rollback().then(function () { self.close(); });
        }
        close() {
            var self = this;
            return Promise.resolve()
                .then(function () {
                switch (self.owner.getType()) {
                    case mq_const_js_1.MQConst.CONNECTION.PHONY:
                        break;
                    case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                        mq_trace_js_1.MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
                        self.conn.end();
                        break;
                    case mq_const_js_1.MQConst.CONNECTION.POOLER:
                    case mq_const_js_1.MQConst.CONNECTION.CLUSTER:
                        mq_trace_js_1.MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                        self.conn.release();
                        break;
                }
            });
        }
    }
    DrvMySQL.Connector = Connector;
    ;
})(DrvMySQL || (exports.DrvMySQL = DrvMySQL = {}));
;
//# sourceMappingURL=drv_mysql2.js.map