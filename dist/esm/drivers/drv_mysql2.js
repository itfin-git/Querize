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
import NodeMysql2 from 'mysql2/promise';
export var DrvMySQL;
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
    function create(type, config, option) {
        let toid = ++_tid;
        switch (type) {
            case MQConst.CONNECTION.CONNECTER:
                return Promise.resolve(new Container(null, MQConst.CONNECTION.CONNECTER, config));
                break;
            case MQConst.CONNECTION.POOLER:
                return Promise.resolve(new Container(NodeMysql2.createPool(config), MQConst.CONNECTION.POOLER));
                break;
            case MQConst.CONNECTION.CLUSTER:
                return Promise.resolve().then(function () {
                    let cluster = NodeMysql2.createPoolCluster();
                    if (Array.isArray(config) != true) {
                        config = [config];
                    }
                    config.forEach(function (citem) {
                        cluster.add(citem.alias, citem);
                    });
                    return new Container(cluster, MQConst.CONNECTION.CLUSTER);
                });
                break;
        }
        throw new Error(`unsupport type(${type}).`);
    }
    DrvMySQL.create = create;
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
            let self = this;
            let next = null;
            switch (this.type) {
                case MQConst.CONNECTION.CONNECTER:
                    next = NodeMysql2.createConnection(this.config).then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case MQConst.CONNECTION.POOLER:
                    next = self.pool.getConnection()
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case MQConst.CONNECTION.CLUSTER:
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
                case MQConst.CONNECTION.PHONY:
                case MQConst.CONNECTION.CONNECTER:
                    break;
                case MQConst.CONNECTION.POOLER:
                    return this.pool.end();
                case MQConst.CONNECTION.CLUSTER:
                    return this.pool.end();
            }
            return Promise.resolve();
        }
    }
    DrvMySQL.Container = Container;
    var _cid = 0;
    class Connector {
        owner;
        conn;
        coid;
        constructor(owner, conn) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        beginTransaction() { return this.conn.beginTransaction(); }
        query(sql) {
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            return this.conn.query(sql).then(function (result) {
                // MariaDB는 [rows, fields] 형태 또는 ResultSetHeader 객체로 옴
                const data = Array.isArray(result) ? result[0] : result;
                if (Array.isArray(data)) {
                    return {
                        affected: 0,
                        rows: data,
                        meta: result,
                        isEmpty: function () {
                            return (result == null || result.length <= 0) ? true : false;
                        },
                    };
                }
                return {
                    affected: data.affectedRows || 0,
                    insertId: data.insertId,
                    rows: [],
                    meta: result,
                    isEmpty: function () {
                        return (result == null || result.length <= 0) ? true : false;
                    },
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
                    case MQConst.CONNECTION.PHONY:
                        break;
                    case MQConst.CONNECTION.CONNECTER:
                        MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
                        self.conn.end();
                        break;
                    case MQConst.CONNECTION.POOLER:
                    case MQConst.CONNECTION.CLUSTER:
                        MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                        self.conn.release();
                        break;
                }
            });
        }
    }
    DrvMySQL.Connector = Connector;
    ;
})(DrvMySQL || (DrvMySQL = {}));
;
//# sourceMappingURL=drv_mysql2.js.map