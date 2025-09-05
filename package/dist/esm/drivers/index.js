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
    ;
    ;
    ;
    async function bring(name) {
        try {
            return await import(`./drv_${name}.js`);
        }
        catch (e) {
            console.warn(`Unsupport library: ${name} (Please refer to the npm page.)`);
            throw e;
        }
    }
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