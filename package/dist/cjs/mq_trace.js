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
exports.MQTrace = void 0;
const util_1 = __importDefault(require("util"));
var MQTrace;
(function (MQTrace) {
    function log(...args) {
        var mesg = util_1.default.format.apply(null, args);
        if (MQTrace.console_func) {
            MQTrace.console_func('log', "Querize", mesg);
        }
        else {
            console.log('log:', "Querize", mesg);
        }
    }
    MQTrace.log = log;
    function err(...args) {
        var mesg = util_1.default.format.apply(null, args);
        if (MQTrace.console_func) {
            MQTrace.console_func('err', "Querize", mesg);
        }
        else {
            console.log('err:', "Querize", mesg);
        }
    }
    MQTrace.err = err;
    function sql(...args) {
        var mesg = util_1.default.format.apply(null, args);
        if (MQTrace.console_func) {
            MQTrace.console_func('sql', "Querize", mesg);
        }
        else {
            console.log('sql:', "Querize", mesg);
        }
    }
    MQTrace.sql = sql;
})(MQTrace || (exports.MQTrace = MQTrace = {}));
;
//# sourceMappingURL=mq_trace.js.map