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
export var MQDriver;
(function (MQDriver) {
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
    ;
    ;
    async function bring(name) {
        try {
            return await import(`./drv_${name}.js`);
        }
        catch (err) {
            console.warn(`Unsupport library: ${name} (Please refer to the npm page.)`);
            throw err;
        }
    }
    function invokeFunction(driver, name, args) {
        return bring(driver).then(function (library) {
            let nmsp = Object.keys(library)[0];
            return library[nmsp][name] && library[nmsp][name](args);
        });
    }
    MQDriver.invokeFunction = invokeFunction;
    function create(type, driver, config) {
        // console.log("type  :", type);
        // console.log("driver:", driver);
        // console.log("config:", config);
        return bring(driver).then(function (library) {
            // console.log("library;", library);
            let nmsp = Object.keys(library)[0];
            return library[nmsp].create(type, config);
        });
    }
    MQDriver.create = create;
})(MQDriver || (MQDriver = {}));
;
//# sourceMappingURL=index.js.map