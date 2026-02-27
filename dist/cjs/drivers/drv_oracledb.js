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
exports.DrvOracleDB = void 0;
const mq_const_js_1 = require("../mq_const.js");
const mq_trace_js_1 = require("../mq_trace.js");
const oracledb_1 = __importDefault(require("oracledb"));
let _initialized = false;
var DrvOracleDB;
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
                    alias: "dbname (poolAlias)",
                    connectString: "127.0.0.1/ORCL",
                    user: "oracle",
                    password: "password",
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
                oracledb_1.default.initOracleClient();
            }
            else {
                oracledb_1.default.initOracleClient(options);
            }
        }
        return Promise.resolve();
    }
    DrvOracleDB.initialize = initialize;
    var _tid = 0;
    function create(type, config, option) {
        let toid = ++_tid;
        switch (type) {
            case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                return Promise.resolve(new Container(null, mq_const_js_1.MQConst.CONNECTION.CONNECTER, config));
                break;
            case mq_const_js_1.MQConst.CONNECTION.POOLER:
                if (Array.isArray(config)) {
                    return Promise.all(config.map(function (cfg) {
                        cfg.poolAlias = cfg.alias;
                        delete cfg.alias;
                        return oracledb_1.default.createPool(cfg);
                    }))
                        .then(function (Pools) {
                        const container = new Container(Pools, mq_const_js_1.MQConst.CONNECTION.POOLER);
                        container.setDefaultDatabase(option.defaultDatabase);
                        return container;
                    });
                }
                return oracledb_1.default.createPool(config)
                    .then(function (Pool) {
                    return new Container(Pool, mq_const_js_1.MQConst.CONNECTION.POOLER);
                });
                break;
        }
        throw new Error(`unsupport type(${type}).`);
    }
    DrvOracleDB.create = create;
    class Container {
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
            dbname = dbname || self.dbname;
            switch (this.type) {
                case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                    return oracledb_1.default.getConnection(this.config).then(function (conn) {
                        return new Connector(self, conn);
                    });
                    break;
                case mq_const_js_1.MQConst.CONNECTION.POOLER:
                    return oracledb_1.default.getPool(dbname).getConnection()
                        .then(function (conn) {
                        return new Connector(self, conn);
                    });
            }
            return Promise.reject(new Error(`Unsupported connection type: ${self.type}`));
        }
        destory() {
            var self = this;
            switch (self.type) {
                case mq_const_js_1.MQConst.CONNECTION.PHONY:
                case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                    break;
                case mq_const_js_1.MQConst.CONNECTION.POOLER:
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
        setDefaultDatabase(dbname) {
            this.dbname = dbname;
        }
    }
    DrvOracleDB.Container = Container;
    var _cid = 0;
    class Connector {
        constructor(owner, conn) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;
            this.isTR = false;
            mq_trace_js_1.MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        // 1. A transaction automatically starts when a DML(INSERT/UPDATE/DELETE/MERGE) statement is executed.
        // 2. Use SET TRANSACTION – this will be handled later as an argument to beginTransaction().
        beginTransaction() { this.isTR = true; return Promise.resolve(); }
        query(sql) {
            mq_trace_js_1.MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}]: query:`, sql);
            const options = {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
                autoCommit: this.isTR !== true,
            };
            return this.conn.execute(sql, {}, options).then(function (result) {
                return {
                    insertId: result.lastRowid,
                    affected: result.rowsAffected || 0,
                    rows: result.rows || [], // oracledb.OUT_FORMAT_OBJECT 설정 필수
                    meta: result,
                    isEmpty: function () {
                        return (result.rows == null || result.rows.length <= 0) ? true : false;
                    },
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
                    case mq_const_js_1.MQConst.CONNECTION.PHONY:
                        break;
                    case mq_const_js_1.MQConst.CONNECTION.CONNECTER:
                        mq_trace_js_1.MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
                        self.conn.release();
                        break;
                    case mq_const_js_1.MQConst.CONNECTION.POOLER:
                        mq_trace_js_1.MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                        self.conn.release();
                        break;
                }
            });
        }
    }
    DrvOracleDB.Connector = Connector;
    ;
})(DrvOracleDB || (exports.DrvOracleDB = DrvOracleDB = {}));
;
//# sourceMappingURL=drv_oracledb.js.map