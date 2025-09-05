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

export namespace MQConst
{
    export enum CONNECTION { // Connect type
        PHONY = "Phony",
        CONNECTER = "Connection",
        POOLER = "Pool",
        CLUSTER = "Cluster",
    };

    export enum OPERATION { // Transaction kind
        TRANSACTION = "T",
        PERSISTENT = "P",
        SINGLETON = "S",
    };

    export const NAME = {
        "T" : "TRANSACTION",
        "P" : "PERSISTENT",
        "S" : "SINGLETON",

        "Phony" : "PHONY",
        "Connection" : "CONNECTER",
        "Pool" : "POOLER",
        "Cluster" : "CLUSTER",
    };
};
