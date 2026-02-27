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
import {MQDriver}   from './index';
import {MQConst}    from '../mq_const.js';
import {MQTrace}    from '../mq_trace.js';
import NodeMaria    from 'mariadb';

export namespace DrvMariaDB
{
    type TypeContainer = NodeMaria.Connection | NodeMaria.Pool | NodeMaria.PoolCluster;
    type TypeConnect   = NodeMaria.Connection | NodeMaria.PoolConnection;

    export function generateConfig() {
        return {
            alias : "local-mariadb",    // transaction,singleton 시 찾을 이름
            host : "127.0.0.1",         // DB ip
            user : "maria",             // DB user
            password : "password",      // DB password
            database : "test-db",       // DB database
            dateStrings : true,
            checkDuplicate : false,
            compress : true,
            supportBigNumbers : true,
            bigNumberStrings : false,
            connectionLimit : 5,
        };
    }

    var _tid: number = 0;
    export function create(type: MQConst.CONNECTION, config: any): Promise<Container> {
        let toid = ++_tid;
        switch( type ) {
        case MQConst.CONNECTION.CONNECTER:
            return Promise.resolve(new Container(null, MQConst.CONNECTION.CONNECTER, config));
            break;
        case MQConst.CONNECTION.POOLER:
            return Promise.resolve(
                new Container(NodeMaria.createPool(config as NodeMaria.PoolConfig), MQConst.CONNECTION.POOLER)
            );
            break;
        case MQConst.CONNECTION.CLUSTER:
            return Promise.resolve().then(function() {
                let cluster = NodeMaria.createPoolCluster();
                if( Array.isArray(config) != true ) {
                    config = [config];
                }
                config.forEach(function(option: any) {
                    cluster.add(option.alias, option);
                });
                return new Container(cluster, MQConst.CONNECTION.CLUSTER);
            });
            break;
        }
        throw new Error(`unsupport type(${type}).`);
    }

    export class Container implements MQDriver.Container {
        pool: TypeContainer | null;
        type: MQConst.CONNECTION;
        config?: any;

        constructor(pool: TypeContainer | null, type: MQConst.CONNECTION, config?: any) {
            this.pool = pool;
            this.type = type;
            this.config = config;
        }

        getType() { return this.type; }
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector> {
            var self = this;
            let next = null;
            switch( this.type ) {
            case MQConst.CONNECTION.CONNECTER:
                next = NodeMaria.createConnection(this.config as NodeMaria.ConnectionConfig).then(function(conn) {
                    return new Connector(self, conn);
                });
                break;
            case MQConst.CONNECTION.POOLER:
                next = (self.pool as NodeMaria.Pool).getConnection()
                .then(function(conn) {
                    return new Connector(self, conn);
                });
                break;
            case MQConst.CONNECTION.CLUSTER:
                const dbid = (`${dbname}.` || '') + (`${dbmode}` || '');
                next = (self.pool as NodeMaria.PoolCluster).getConnection(`${dbid}*`)
                .then(function(conn) {
                    return new Connector(self, conn);
                });
                break;
            }
            
            if( next ) {
                return next.then(function(connector) {
                    if( dbname != null ) { return connector.query(`USE ${dbname}`).then(function() { return connector; }) }
                    return connector;
                });
            }
            return Promise.reject(new Error(`Unsupported connection type: ${self.type}`));
        }
        destory(): Promise<any> {
            switch( this.type ) {
            case MQConst.CONNECTION.PHONY:
            case MQConst.CONNECTION.CONNECTER:
                break;
            case MQConst.CONNECTION.POOLER:
                return (this.pool as NodeMaria.Pool).end();
            case MQConst.CONNECTION.CLUSTER:
                return (this.pool as NodeMaria.PoolCluster).end();
            }
            return Promise.resolve();
        }
    }

    var _cid: number = 0;
    export class Connector implements MQDriver.Connector {
        public readonly owner!: MQDriver.Container;
        public readonly conn!: TypeConnect;

        public coid: number;

        constructor(owner: any, conn: TypeConnect) {
            this.owner = owner;
            this.conn = conn;
            this.coid = ++_cid;

            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        
        getId() { return this.coid.toString(); }
        beginTransaction(): Promise<any> { return this.conn.beginTransaction(); }
        query(sql: string): Promise<MQDriver.ResultSet> {
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            return this.conn.query(sql).then(function(result) {
                if( Array.isArray(result) ) {
                    return {
                        affected: 0,
                        rows: result || [],
                        meta: result,
                        isEmpty: function() {
                            return (result == null || result.length <= 0) ? true : false;
                        },
                    };
                }

                // DML(INSERT, UPDATE, DELETE) 결과인 경우 (ResultSetHeader 객체)
                return {
                    affected: result.affectedRows || 0,
                    insertId: result.insertId,
                    rows: [],
                    meta: result,
                    isEmpty: function() {
                        return (result == null || result.length <= 0) ? true : false;
                    },
                };
            });
        }
        commit(): Promise<any> {
            var self = this;
            return self.conn.commit().then(function() { self.close(); });
        }
        rollback(): Promise<any> {
            var self = this;
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
                    (self.conn as NodeMaria.Connection).end();
                    break;
                case MQConst.CONNECTION.POOLER:
                case MQConst.CONNECTION.CLUSTER:
                    MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                    (self.conn as NodeMaria.PoolConnection).release();
                    break;
                }
            });
        }
    };
};
