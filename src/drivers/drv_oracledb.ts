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
import {MQDriver}  from './index';
import {MQConst}   from '../mq_const.js';
import {MQTrace}   from '../mq_trace.js';
import OracleDB    from 'oracledb';

let _initialized = false;
function _initOnce() {
    if( _initialized ) return;
    _initialized = true;

    console.log("ORACLEDB.initOracleClient");
    OracleDB.initOracleClient();
}
_initOnce();

export namespace DrvOracleDB
{
    type TypeContainer = OracleDB.Connection | OracleDB.Pool;
    type TypeConnect   = OracleDB.Connection;

    var _tid: number = 0;
    export function create(type: MQConst.CONNECTION, config: MQDriver.Option|MQDriver.Option[]) {
        let toid = ++_tid;
        switch( type ) {
        case MQConst.CONNECTION.CONNECTER:
            return Promise.resolve(new Container(null, MQConst.CONNECTION.CONNECTER, config));
            break;
        case MQConst.CONNECTION.POOLER:
            return OracleDB.createPool(config as OracleDB.PoolAttributes)
            .then(function(Pool) { return new Container(Pool, MQConst.CONNECTION.POOLER); });
            break;
        }
        throw new Error(`unsupport type(${type}).`);
    }

    export class Container implements MQDriver.Container {
        pool: TypeContainer | null;
        type: MQConst.CONNECTION;
        config?: MQDriver.Option | MQDriver.Option[];

        constructor(pool: TypeContainer | null, type: MQConst.CONNECTION, config?: MQDriver.Option | MQDriver.Option[]) {
            this.pool = pool;
            this.type = type;
            this.config = config;
        }

        getType() { return this.type; }
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector> {
            var self = this;
            switch( this.type ) {
            case MQConst.CONNECTION.CONNECTER:
                return OracleDB.getConnection(this.config as OracleDB.PoolAttributes).then(function(conn) {
                    return new Connector(self, conn);
                });
                break;
            case MQConst.CONNECTION.POOLER:
                return (self.pool as OracleDB.Pool).getConnection()
                .then(function(conn) {
                    return new Connector(self, conn);
                });
            }
            return Promise.reject(new Error(`Unsupported connection type: ${self.type}`));
        }
        destory() {
            switch( this.type ) {
            case MQConst.CONNECTION.PHONY:
            case MQConst.CONNECTION.CONNECTER:
                break;
            case MQConst.CONNECTION.POOLER:
                // Force close after 10 seconds if it does not shut down normally.
                return (this.pool as OracleDB.Pool).close(10);
            }
            return Promise.resolve();
        }
    }

    var _cid: number = 0;
    export class Connector implements MQDriver.Connector {
        public readonly owner!: MQDriver.Container;
        public readonly conn!: TypeConnect;

        public istr!: Boolean; // is-transaction
        public coid: number;

        constructor(owner: any, conn: TypeConnect) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;
            this.istr = false;

            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        
        getId() { return this.coid.toString(); }
        // 1. A transaction automatically starts when a DML(INSERT/UPDATE/DELETE/MERGE) statement is executed.
        // 2. Use SET TRANSACTION – this will be handled later as an argument to beginTransaction().
        beginTransaction(): Promise<any> { this.istr = true; return Promise.resolve(); }
        query(sql: string): Promise<any> {
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            if( this.istr != true ) {
                // Use autoCommit when not in a transaction-function.
                return this.conn.execute(sql, {}, { autoCommit: true });
            }
            return this.conn.execute(sql);
        }

        commit(): Promise<any> {
            var self = this;
            self.istr = false;
            return self.conn.commit().then(function() { self.close(); });
        }
        rollback(): Promise<any> {
            var self = this;
            self.istr = false;
            return self.conn.rollback().then(function() { self.close(); });
        }
        close(): Promise<any> {
            var self = this;
            return Promise.resolve()
            .then(function() {
                switch( self.owner.getType() ) {
                case MQConst.CONNECTION.PHONY:
                    break;
                case MQConst.CONNECTION.CONNECTER:
                    MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
                    (self.conn as OracleDB.Connection).release();
                    break;
                case MQConst.CONNECTION.POOLER:
                    MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                    (self.conn as OracleDB.Connection).release();
                    break;
                }
            });
        }
    };
};
