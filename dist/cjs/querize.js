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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Querize = void 0;
exports.setTrace = setTrace;
const index_js_1 = require("./drivers/index.js");
const mq_trace_js_1 = require("./mq_trace.js");
const mq_const_js_1 = require("./mq_const.js");
const mq_database_js_1 = require("./mq_database.js");
class Querize {
    constructor(driver, doptions) {
        this.driver = driver;
    }
    initialize(options) {
        return index_js_1.MQDriver.invokeFunction(this.driver, 'initialize', options);
    }
    generateConfig(type) {
        return index_js_1.MQDriver.invokeFunction(this.driver, 'generateConfig', type);
    }
    createQuery() {
        mq_trace_js_1.MQTrace.log(`PHONY: create.`);
        return index_js_1.MQDriver.create(mq_const_js_1.MQConst.CONNECTION.PHONY, this.driver)
            .then(function (container) {
            return new mq_database_js_1.MQDatabase.Class(container);
        });
    }
    createConnect(option) {
        mq_trace_js_1.MQTrace.log(`CONNECTER: create.`);
        if (Array.isArray(option)) {
            return Promise.reject(new Error('createConnect only 1-connection.'));
        }
        return index_js_1.MQDriver.create(mq_const_js_1.MQConst.CONNECTION.CONNECTER, this.driver, option)
            .then(function (container) {
            return new mq_database_js_1.MQDatabase.Class(container);
        });
    }
    createPool(option) {
        mq_trace_js_1.MQTrace.log(`POOLER: create.`);
        return index_js_1.MQDriver.create(mq_const_js_1.MQConst.CONNECTION.POOLER, this.driver, option)
            .then(function (container) {
            return new mq_database_js_1.MQDatabase.Class(container);
        });
    }
    createCluster(option) {
        mq_trace_js_1.MQTrace.log(`CLUSTER: create.`);
        return index_js_1.MQDriver.create(mq_const_js_1.MQConst.CONNECTION.CLUSTER, this.driver, option)
            .then(function (container) {
            return new mq_database_js_1.MQDatabase.Class(container);
        });
    }
    static setTrace(callback) {
        // message
        mq_trace_js_1.MQTrace.console_func = callback;
    }
}
exports.Querize = Querize;
;
function setTrace(callback) {
    // message
    mq_trace_js_1.MQTrace.console_func = callback;
}
exports.default = Querize; // default
//# sourceMappingURL=querize.js.map