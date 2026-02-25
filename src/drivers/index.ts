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
import {MQConst}    from '../mq_const.js';

export namespace MQDriver
{
    /*
    export interface Option {
        alias : string,         // transaction,singleton 시 찾을 이름
        host : string,          // DB ip
        user : string,          // DB user
        password : string,      // DB password
        database : string,      // DB database
        dateStrings? : boolean,
        checkDuplicate? : boolean,
        compress? : boolean,
        supportBigNumbers? : boolean,
        bigNumberStrings? : boolean,
        connectionLimit? : number,
    }; */

    export interface Container {
        getType(): MQConst.CONNECTION,
        getConnection(dbname?: string, dbmode?: string): Promise<MQDriver.Connector>,
        destory(): Promise<any>,
    };
    export interface Connector {
        getId : () => string,
        beginTransaction : () => Promise<any>,
        commit : () => Promise<any>,
        rollback : () => Promise<any>,
        query : (sql: string) => Promise<any>,
        close : () => Promise<any>,
    };

    async function bring(name: string) {
        try {
            return await import(`./drv_${name}.js`);
        }
        catch(err) {
            console.warn(`Unsupport library: ${name} (Please refer to the npm page.)`);
            throw err;
        }
    }

    export function invokeFunction(driver: string, name: string, args?: any): Promise<any> {
        return bring(driver).then(function(library) {
            let nmsp = Object.keys(library)[0];
            return library[nmsp][name] && library[nmsp][name](args);
        });
    }

    export function create(type: MQConst.CONNECTION, driver: string, config?: any): Promise<MQDriver.Container> {
        // console.log("type  :", type);
        // console.log("driver:", driver);
        // console.log("config:", config);
        return bring(driver).then(function(library) {
            // console.log("library;", library);
            let nmsp = Object.keys(library)[0];
            return library[nmsp].create(type, config);
        });
    }
};
