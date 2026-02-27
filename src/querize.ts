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

export class Querize {
    driver: string;

    constructor(driver: string, doptions: object) {
        this.driver = driver;
    }

    initialize(options?: Object): Promise<any> {
        return MQDriver.invokeFunction(this.driver, 'initialize', options);
    }
    generateConfig(type?: string): Promise<any> {
        return MQDriver.invokeFunction(this.driver, 'generateConfig', type);
    }

    createQuery(): Promise<MQDatabase.Class> {
        MQTrace.log(`PHONY: create.`);
        
        return MQDriver.create(MQConst.CONNECTION.PHONY, this.driver)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    createConnect(config : any): Promise<MQDatabase.Class> {
        MQTrace.log(`CONNECTER: create.`);

        if( Array.isArray(config) ) {
            return Promise.reject(new Error('createConnect only 1-connection.'));
        }

        return MQDriver.create(MQConst.CONNECTION.CONNECTER, this.driver, config)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    createPool(config : any, option?: any): Promise<MQDatabase.Class> {
        MQTrace.log(`POOLER: create.`);

        return MQDriver.create(MQConst.CONNECTION.POOLER, this.driver, config, option)
        .then(function(container) {
            return new MQDatabase.Class(container);
        });
    }

    createCluster(config : any): Promise<MQDatabase.Class> {
        MQTrace.log(`CLUSTER: create.`);

        return MQDriver.create(MQConst.CONNECTION.CLUSTER, this.driver, config)
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
