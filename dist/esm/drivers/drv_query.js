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
import { MQTrace } from '../mq_trace.js';
export var DrvQuery;
(function (DrvQuery) {
    function create(type, config) {
        return Promise.resolve(new Container(type));
    }
    DrvQuery.create = create;
    class Container {
        type;
        constructor(type) {
            this.type = type;
        }
        getType() { return this.type; }
        getConnection(dbname, dbmode) {
            return Promise.resolve(new Connector(this));
        }
        destory() { return Promise.resolve(); }
    }
    DrvQuery.Container = Container;
    var _cid = 0;
    class Connector {
        owner;
        coid;
        constructor(owner) {
            this.owner = owner;
            this.coid = ++_cid;
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: connected.`);
        }
        getId() { return this.coid.toString(); }
        beginTransaction() { return Promise.resolve(); }
        query(sql) {
            MQTrace.log(`[C:${this.coid}] [${this.owner.getType()}}]: query:`, sql);
            return Promise.resolve();
        }
        commit() { return Promise.resolve(); }
        rollback() { return Promise.resolve(); }
        close() {
            var self = this;
            MQTrace.log(`[C:${self.coid}] [${self.owner.getType()}}]: disconnected[end].`);
            return Promise.resolve();
        }
    }
    DrvQuery.Connector = Connector;
    ;
})(DrvQuery || (DrvQuery = {}));
;
//# sourceMappingURL=drv_query.js.map