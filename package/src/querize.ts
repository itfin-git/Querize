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
import {MQDriver}   from './drivers/index.js';
import {MQTrace}    from './mq_trace.js';
import {MQConst}    from './mq_const.js';
import {MQDatabase} from './mq_database.js';

type MQOption = MQDriver.Option;

export class Querize {
    driver: string;

    constructor(driver: string, ) {
        this.driver = driver;
    }

    createQuery(): Promise<MQDatabase.Class> {
        MQTrace.log(`PHONY: create.`);
        
        return MQDriver.create(MQConst.CONNECTION.PHONY, this.driver)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    createConnect(option : MQOption | MQOption[]): Promise<MQDatabase.Class> {
        MQTrace.log(`CONNECTER: create.`);

        return MQDriver.create(MQConst.CONNECTION.CONNECTER, this.driver, option)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    createPool(option : MQOption | MQOption[]): Promise<MQDatabase.Class> {
        MQTrace.log(`POOLER: create.`);

        return MQDriver.create(MQConst.CONNECTION.POOLER, this.driver, option)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    createCluster(option : MQOption | MQOption[]): Promise<MQDatabase.Class> {
        MQTrace.log(`CLUSTER: create.`);

        return MQDriver.create(MQConst.CONNECTION.CLUSTER, this.driver, option)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    static setTrace(callback: Function) {
        // message
        MQTrace.console_func = callback;
    }
};

export function setTrace(callback: Function) {
    // message
    MQTrace.console_func = callback;
}


export default Querize; // default
