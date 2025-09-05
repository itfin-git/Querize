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
import NodeUtil from "util";
export var MQTrace;
(function (MQTrace) {
    function log(...args) {
        var mesg = NodeUtil.format.apply(null, args);
        if (MQTrace.console_func) {
            MQTrace.console_func('log', "Querize", mesg);
        }
        else {
            console.log('log:', "Querize", mesg);
        }
    }
    MQTrace.log = log;
    function err(...args) {
        var mesg = NodeUtil.format.apply(null, args);
        if (MQTrace.console_func) {
            MQTrace.console_func('err', "Querize", mesg);
        }
        else {
            console.log('err:', "Querize", mesg);
        }
    }
    MQTrace.err = err;
    function sql(...args) {
        var mesg = NodeUtil.format.apply(null, args);
        if (MQTrace.console_func) {
            MQTrace.console_func('sql', "Querize", mesg);
        }
        else {
            console.log('sql:', "Querize", mesg);
        }
    }
    MQTrace.sql = sql;
})(MQTrace || (MQTrace = {}));
;
//# sourceMappingURL=mq_trace.js.map