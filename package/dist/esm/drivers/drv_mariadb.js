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
import NodeMaria from 'mariadb';
export var DrvMariaDB;
(function (DrvMariaDB) {
    var _tid = 0;
    function create(type, config) {
        let toid = ++_tid;
        switch (type) {
            case MQConst.CONNECTION.CONNECTER:
                return Promise.resolve(new Container(null, MQConst.CONNECTION.CONNECTER, config));
                break;
            case MQConst.CONNECTION.POOLER:
                return Promise.resolve(new Container(NodeMaria.createPool(config), MQConst.CONNECTION.POOLER));
                break;
            case MQConst.CONNECTION.CLUSTER:
                return Promise.resolve().then(function () {
                    let cluster = NodeMaria.createPoolCluster();
                    if (Array.isArray(config) != true) {
                        config = [config];
                    }
                    config.forEach(function (option) {
                        cluster.add(option.alias, option);
                    });
                    return new Container(cluster, MQConst.CONNECTION.CLUSTER);
                });
                break;
        }
        throw new Error(`unsupport type(${type}).`);
    }
    DrvMariaDB.create = create;
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
                    return NodeMaria.createConnection(this.config).then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case MQConst.CONNECTION.POOLER:
                    return self.pool.getConnection()
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
                case MQConst.CONNECTION.CLUSTER:
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
                    return this.pool.end();
                case MQConst.CONNECTION.CLUSTER:
                    return this.pool.end();
            }
            return Promise.resolve();
        }
    }
    DrvMariaDB.Container = Container;
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
            return this.conn.query(sql);
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
    DrvMariaDB.Connector = Connector;
    ;
})(DrvMariaDB || (DrvMariaDB = {}));
;
//# sourceMappingURL=drv_mariadb.js.map