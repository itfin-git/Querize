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
export var DrvOracleDB;
(function (DrvOracleDB) {
    function generateConfig(type) {
        switch (type) {
            case 'initialize':
                return {
                    libDir: 'C:\\oracle\\instantclient_19_8', // 클라이언트 위치
                    configDir: 'C:\\oracle\\network\\admin', // TNS 설정 위치(tnsnames.ora, sqlnet.ora, oraaccess.xml)
                    errorUrl: 'https://my-company.com', // 커스텀 에러 안내
                    driverName: 'MyNodeApp:1.0' // DB 식별용 이름(DB 서버 모니터링 시 식별할 수 있는 드라이버 이름)
                };
                break;
            case 'createConnect':
            case 'createPool':
            default:
                return {
                    poolAlias: "dbname",
                    user: "oracle",
                    password: "password",
                    connectString: "127.0.0.1/ORCL",
                    poolMax: 10, //4
                    poolMin: 0, //0
                    poolIncrement: 1, //1
                    poolTimeout: 30, //60
                    poolPingInterval: 10, //60
                };
        }
    }
    DrvOracleDB.generateConfig = generateConfig;
    function initialize(options) {
        if (_initialized == false) {
            _initialized = true;
            console.log("ORACLEDB.initOracleClient");
            if (options === undefined) {
                OracleDB.initOracleClient();
            }
            else {
                OracleDB.initOracleClient(options);
            }
        }
        return Promise.resolve();
    }
    DrvOracleDB.initialize = initialize;
    var _tid = 0;
    function create(type, config) {
        let toid = ++_tid;
        switch (type) {
            case MQConst.CONNECTION.CONNECTER:
                return Promise.resolve(new Container(null, MQConst.CONNECTION.CONNECTER, config));
                break;
            case MQConst.CONNECTION.POOLER:
                if (Array.isArray(config)) {
                    return Promise.all(config.map(function (cfg) { return OracleDB.createPool(cfg); }))
                        .then(function (Pools) {
                        return new Container(Pools, MQConst.CONNECTION.POOLER);
                    });
                }
                return OracleDB.createPool(config)
                    .then(function (Pool) {
                    return new Container(Pool, MQConst.CONNECTION.POOLER);
                });
                break;
        }
        throw new Error(`unsupport type(${type}).`);
    }
    DrvOracleDB.create = create;
    class Container {
        pool;
        pools;
        type;
        config;
        constructor(pool, type, config) {
            if (Array.isArray(pool)) {
                this.pool = null;
                this.pools = pool;
            }
            else {
                this.pools = null;
                this.pool = pool;
            }
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
                    return OracleDB.getPool(dbname).getConnection()
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
            }
            return Promise.reject(new Error(`Unsupported connection type: ${self.type}`));
        }
        destory() {
            var self = this;
            switch (self.type) {
                case MQConst.CONNECTION.PHONY:
                case MQConst.CONNECTION.CONNECTER:
                    break;
                case MQConst.CONNECTION.POOLER:
                    // Force close after 10 seconds if it does not shut down normally.
                    if (self.pool != null) {
                        return self.pool.close(10);
                    }
                    else if (self.pools != null) {
                        return Promise.all(self.pools.map(function (pool) { return pool.close(0); }));
                    }
                    break;
            }
            return Promise.resolve();
        }
    }
    DrvOracleDB.Container = Container;
    var _cid = 0;
    class Connector {
        owner;
        conn;
        isTR; // is-transaction
        coid;
        constructor(owner, conn) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;
            this.isTR = false;
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        // 1. A transaction automatically starts when a DML(INSERT/UPDATE/DELETE/MERGE) statement is executed.
        // 2. Use SET TRANSACTION – this will be handled later as an argument to beginTransaction().
        beginTransaction() { this.isTR = true; return Promise.resolve(); }
        query(sql) {
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}]: query:`, sql);
            const options = {
                outFormat: OracleDB.OUT_FORMAT_OBJECT,
                autoCommit: this.isTR !== true,
            };
            return this.conn.execute(sql, {}, options).then(function (result) {
                return {
                    insertId: result.lastRowid,
                    affected: result.rowsAffected || 0,
                    rows: result.rows || [], // oracledb.OUT_FORMAT_OBJECT 설정 필수
                    meta: result,
                };
            });
        }
        commit() {
            var self = this;
            self.isTR = false;
            return self.conn.commit().then(function () { self.close(); });
        }
        rollback() {
            var self = this;
            self.isTR = false;
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
//# sourceMappingURL=drv_oracledb.js.map