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
exports.MQConst = void 0;
var MQConst;
(function (MQConst) {
    let CONNECTION;
    (function (CONNECTION) {
        CONNECTION["PHONY"] = "Phony";
        CONNECTION["CONNECTER"] = "Connection";
        CONNECTION["POOLER"] = "Pool";
        CONNECTION["CLUSTER"] = "Cluster";
    })(CONNECTION = MQConst.CONNECTION || (MQConst.CONNECTION = {}));
    ;
    let OPERATION;
    (function (OPERATION) {
        OPERATION["TRANSACTION"] = "T";
        OPERATION["PERSISTENT"] = "P";
        OPERATION["SINGLETON"] = "S";
    })(OPERATION = MQConst.OPERATION || (MQConst.OPERATION = {}));
    ;
    MQConst.NAME = {
        "T": "TRANSACTION",
        "P": "PERSISTENT",
        "S": "SINGLETON",
        "Phony": "PHONY",
        "Connection": "CONNECTER",
        "Pool": "POOLER",
        "Cluster": "CLUSTER",
    };
})(MQConst || (exports.MQConst = MQConst = {}));
;
//# sourceMappingURL=mq_const.js.map