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

export namespace MQTrace {
    // export let console_func : Function;
    // export type type_func = (level: 'log'|'err'|'sql', tag: string, msg: string) => void;
    export let console_func : Function | undefined;

    export function log(...args: any[]) {
        var mesg = NodeUtil.format.apply(null, args);
        if( console_func ) {
            console_func('log', "Querize", mesg);
        } else {
            console.log('log:', "Querize", mesg);
        }
    }

    export function err(...args: any[]) {
        var mesg = NodeUtil.format.apply(null, args);
        if( console_func ) {
            console_func('err', "Querize", mesg);
        } else {
            console.log('err:', "Querize", mesg);
        }
    }

    export function sql(...args: any[]) {
        var mesg = NodeUtil.format.apply(null, args);
        if( console_func ) {
            console_func('sql', "Querize", mesg);
        } else {
            console.log('sql:', "Querize", mesg);
        }
    }

};
