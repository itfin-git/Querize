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
    export interface ResultSet {
        insertId?: any;     // 마지막 AUTO_INCREMENT or LAST_INSERT_ID()
        affected: number;   // INSERT, UPDATE, DELETE 영향 받은 행 수
        rows: any[];        // SELECT 결과 (항상 객체 배열 형태)
        meta: any;          // 원본 드라이버 결과 (필요 시 대비)
        isEmpty(): boolean;
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
