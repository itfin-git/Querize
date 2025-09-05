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
import { MQQuery } from './mq_query.js';
export var MQWhere;
(function (MQWhere) {
    function literal(val) {
        return { value: val };
    }
    MQWhere.literal = literal;
    function value(val) {
        switch (typeof (val)) {
            case 'string':
                val = val.toString();
                // val = val.toString().split("\'").join("\\\'").substring(0);
                return `'${val}'`;
            case 'object':
                return val.value;
        }
        return val;
    }
    MQWhere.value = value;
    function expression(val) {
        switch (typeof (val)) {
            case 'number':
                return `= ${val}`;
            case 'string':
                // val = val.toString().split("\'").join("\\\'").substring(0);
                val = val.toString().trim();
                switch (val.charAt(0)) {
                    case '<':
                    case '>':
                    case '=':
                        return `${val}`;
                }
                return `= '${val}'`;
            case 'object':
                return val.value;
        }
        return val;
    }
    MQWhere.expression = expression;
    ;
    function way_array(argv) {
        var query = '';
        var str_qry;
        for (const obj of argv) {
            str_qry = way_object(obj);
            if (str_qry.length > 0) {
                if (query.length > 0)
                    query += " OR ";
                query += str_qry;
            }
        }
        if (query.length > 0)
            return "(" + query + ")";
        return "";
    }
    MQWhere.way_array = way_array;
    function way_object(argv) {
        var query = '';
        if (argv instanceof MQWhere.Class) {
            query += argv.wheres;
        }
        else {
            var str_qry = '';
            for (var [key, val] of Object.entries(argv)) {
                if (val == null) {
                    // query += `${key} IS NULL `; // 20210209 : null인 항목은 무시, '\$is null' 로 사용
                    continue;
                }
                str_qry = '';
                if (Array.isArray(val) == true) {
                    if (val.length > 0) {
                        str_qry = '(';
                        val.forEach(function (item, idx) {
                            if (item == null)
                                return;
                            if (idx > 0)
                                str_qry += "OR ";
                            str_qry += `${key} ${MQWhere.expression(item)} `;
                        });
                        str_qry += ') ';
                    }
                }
                else {
                    if (val != null) {
                        str_qry = `${key} ${MQWhere.expression(val)}`;
                    }
                }
                if (str_qry.length > 0) {
                    if (query.length > 0)
                        query += " AND ";
                    query += str_qry;
                }
            }
        }
        if (query.length > 0)
            return "(" + query + ")";
        return "";
    }
    MQWhere.way_object = way_object;
    function way_where(values) {
        var query = '';
        var str_qry;
        var apos;
        if (values == null || values.length <= 0)
            return '';
        if (values.length > 1)
            query += '(';
        for (apos = 0; apos < values.length; apos++) {
            var argv = values[apos];
            if (argv == null)
                break;
            if (Array.isArray(argv) == true) { // array
                str_qry = MQWhere.way_array(argv);
            }
            else if (typeof (argv) == 'object') { // object
                str_qry = way_object(argv);
            }
            else {
                throw new Error(`not support type. (${typeof (argv)})`);
            }
            if (str_qry.length > 0) {
                if (apos > 0)
                    query += " AND ";
                query += str_qry;
            }
            // console.log("query:", query);
        }
        if (values.length > 1)
            query += ')';
        return query;
    }
    MQWhere.way_where = way_where;
    class Class {
        owner;
        wheres;
        constructor(owner, values) {
            this.owner = owner;
            this.wheres = '';
            if (values) {
                this.wheres += MQWhere.way_where(values);
            }
        }
        and() {
            var qry = MQWhere.way_where(Array.from(arguments));
            if (qry.length > 0) {
                if (this.wheres.length > 0)
                    this.wheres = `(${this.wheres})`;
                this.wheres += `${qry}`;
            }
            return this;
        }
        or() {
            var qry = MQWhere.way_where(Array.from(arguments));
            if (qry.length > 0) {
                if (this.wheres.length > 0)
                    this.wheres = `(${this.wheres}) OR `;
                this.wheres += `(${qry})`;
            }
            return this;
        }
        order_by() {
            this.owner.order_by(...Array.from(arguments));
            return this;
        }
        group_by() {
            this.owner.group_by(...Array.from(arguments));
            return this;
        }
        limit(pos, cnt) {
            this.owner.limit(pos, cnt);
            return this;
        }
        select(...fields) {
            this.owner.dml = MQQuery._sql_select(this.owner, fields.flat(), this);
            return this.owner;
            // return this.owner.select(fields, appends);
        }
        insert() {
            return this.owner.setError(new Error('insert not need where.'));
        }
        insert_ignore() {
            return this.owner.setError(new Error('insert[ignore] not need where.'));
        }
        delete() {
            this.owner.dml = MQQuery._sql_delete(this.owner, this);
            return this.owner;
        }
        update(fields) {
            this.owner.dml = MQQuery._sql_update(this.owner, fields, this);
            return this.owner;
        }
        execute() {
            return Promise.reject(new Error('need select,update,delete... '));
        }
    }
    MQWhere.Class = Class;
    ;
})(MQWhere || (MQWhere = {}));
;
//# sourceMappingURL=mq_where.js.map