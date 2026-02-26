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
import NodeMysql2   from 'mysql2/promise';

export namespace DrvMySQL
{
    type TypeContainer = NodeMysql2.Connection | NodeMysql2.Pool | NodeMysql2.PoolCluster;
    type TypeConnect   = NodeMysql2.Connection | NodeMysql2.PoolConnection;

    export function generateConfig() {
        return {
            alias : "local-mysql",      // transaction,singleton 시 찾을 이름
            host : "127.0.0.1",         // DB ip
            user : "mysql",             // DB user
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
                new Container(NodeMysql2.createPool(config as NodeMysql2.PoolOptions), MQConst.CONNECTION.POOLER)
            );
            break;
        case MQConst.CONNECTION.CLUSTER:
            return Promise.resolve().then(function() {
                let cluster = NodeMysql2.createPoolCluster();
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
            let self = this;
            let next = null;
            switch( this.type ) {
            case MQConst.CONNECTION.CONNECTER:
                next = NodeMysql2.createConnection(this.config as NodeMysql2.ConnectionOptions).then(function(conn) {
                    return new Connector(self, conn);
                });
                break;
            case MQConst.CONNECTION.POOLER:
                next = (self.pool as NodeMysql2.Pool).getConnection()
                .then(function(conn) {
                    return new Connector(self, conn);
                });
                break;
            case MQConst.CONNECTION.CLUSTER:
                next = (self.pool as NodeMysql2.PoolCluster).getConnection()
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
                return (this.pool as NodeMysql2.Pool).end();
            case MQConst.CONNECTION.CLUSTER:
                return (this.pool as NodeMysql2.PoolCluster).end();
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
                // MariaDB는 [rows, fields] 형태 또는 ResultSetHeader 객체로 옴
                const data = Array.isArray(result) ? result[0] : result;
                if( Array.isArray(data) ) {
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
                    (self.conn as NodeMysql2.Connection).end();
                    break;
                case MQConst.CONNECTION.POOLER:
                case MQConst.CONNECTION.CLUSTER:
                    MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[release].`);
                    (self.conn as NodeMysql2.PoolConnection).release();
                    break;
                }
            });
        }
    };
};
