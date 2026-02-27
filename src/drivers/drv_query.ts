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

export namespace DrvQuery
{
    export function create(type: MQConst.CONNECTION, config: any, option?: any) : Promise<Container> {
        return Promise.resolve(new Container(type));
    }

    export class Container implements MQDriver.Container {
        type: MQConst.CONNECTION;
        constructor(type: MQConst.CONNECTION) {
            this.type = type;
        }
        getType() { return this.type; }
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector> {
            return Promise.resolve(new Connector(this));
        }
        destory() : Promise<any> { return Promise.resolve(); }
    }

    var _cid: number = 0;
    export class Connector implements MQDriver.Connector {
        public readonly owner!: Container;

        public coid: number;

        constructor(owner: Container) {
            this.owner = owner;
            this.coid = ++_cid;
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        beginTransaction() : Promise<any> { return Promise.resolve(); }
        query(sql: string) : Promise<any> { 
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            return Promise.resolve();
        }
        commit() : Promise<any> { return Promise.resolve(); }
        rollback() : Promise<any> { return Promise.resolve(); }
        close() : Promise<any> {
            var self = this;
            MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
            return Promise.resolve();
        }
    };
};
