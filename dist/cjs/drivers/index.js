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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQDriver = void 0;
var MQDriver;
(function (MQDriver) {
    ;
    ;
    ;
    function bring(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Promise.resolve(`${`./drv_${name}.js`}`).then(s => __importStar(require(s)));
            }
            catch (err) {
                console.warn(`Unsupport library: ${name} (Please refer to the npm page.)`);
                throw err;
            }
        });
    }
    function invokeFunction(driver, name, args) {
        return bring(driver).then(function (library) {
            let nmsp = Object.keys(library)[0];
            return library[nmsp][name] && library[nmsp][name](args);
        });
    }
    MQDriver.invokeFunction = invokeFunction;
    function create(type, driver, config, option) {
        // console.log("type  :", type);
        // console.log("driver:", driver);
        // console.log("config:", config);
        return bring(driver).then(function (library) {
            // console.log("library;", library);
            let nmsp = Object.keys(library)[0];
            return library[nmsp].create(type, config, option);
        });
    }
    MQDriver.create = create;
})(MQDriver || (exports.MQDriver = MQDriver = {}));
;
//# sourceMappingURL=index.js.map