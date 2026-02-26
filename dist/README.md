# Querize.js

> **MySQL / MariaDB / Oracle** query builder for Node.js  
> Promise-based · Fluent API · Connection Pool / Cluster · Transaction support

[![npm](https://img.shields.io/npm/v/querize)](https://www.npmjs.com/package/querize)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [initialize()](#initialize)
- [Connection Modes](#connection-modes)
  - [createConnect](#createconnect)
  - [createPool](#createpool)
  - [createCluster](#createcluster)
- [Operation Modes](#operation-modes)
  - [transaction()](#transaction)
  - [singleton()](#singleton)
- [Query API](#query-api)
  - [Table / JOIN](#table--join)
  - [WHERE](#where)
  - [SELECT](#select)
  - [INSERT](#insert)
  - [UPDATE](#update)
  - [DELETE](#delete)
  - [Modifiers](#modifiers)
  - [Sub-queries](#sub-queries)
- [ResultSet](#resultset)
- [Oracle Driver](#oracle-driver)
- [Trace / Logging](#trace--logging)

---

## Overview

Querize.js is a lightweight, promise-based SQL query builder for Node.js targeting MySQL, MariaDB, and Oracle databases.  
It lets you compose queries through a fluent chaining API without writing raw SQL strings.

```
Querize → MQDatabase → MQQuery → MQWhere → execute()
```

---

## Installation

```bash
# Install Querize
npm install querize

# Install your database driver
npm install mysql2      # MySQL
npm install mariadb     # MariaDB
npm install oracledb    # Oracle
```

> Drivers are loaded dynamically — install only the one you need.

---

## Quick Start

```javascript
import { Querize } from 'querize';

// 1. Create a Querize instance with your driver
const qz = new Querize('mysql2'); // 'mysql2' | 'mariadb' | 'oracle'

// 2. Initialize the driver (always recommended)
await qz.initialize();

// 3. Create a connection pool
const Database = await qz.createPool({
  alias:           'main',
  host:            'localhost',
  user:            'root',
  password:        'password',
  database:        'mydb',
  connectionLimit: 10,
});

// 4. Run a query
const query = await Database.singleton();
const result = await query.table('users').where({ id: 1 }).select().execute();
console.log(result.rows); // [{ id: 1, name: 'Alice', ... }]

// 5. Shutdown
await Database.destroy();
```

---

## initialize()

`qz.initialize(option?)` initializes the driver. Call it **once at application startup**, before creating any connection.

**It is recommended to always call `initialize()` regardless of which driver you use.**  
For mysql2 and mariadb, it resolves immediately with no side effects.  
For Oracle, it sets up the Instant Client path at this stage.  
This keeps your initialization flow consistent and makes driver swaps seamless.

### Signature

```typescript
qz.initialize(option?: { libDir?: string }): Promise<void>
```

### Parameters

| Parameter | Driver | Description |
|-----------|--------|-------------|
| `option.libDir` | Oracle only | Path to the Oracle Instant Client library. Required for Thick mode. |
| _(none)_ | mysql2 / mariadb | Call with no arguments. Resolves immediately with no internal processing. |

### Behavior by Driver

| Driver | Behavior |
|--------|----------|
| `mysql2` | Resolves immediately. No initialization required. |
| `mariadb` | Resolves immediately. No initialization required. |
| `oracle` | Calls `oracledb.initOracleClient()` if `libDir` is provided (Thick mode). Otherwise runs in Thin mode. |

### Examples

```javascript
import { Querize } from 'querize';

// mysql2 / mariadb — call with no arguments
const qz = new Querize('mysql2');
await qz.initialize();
const Database = await qz.createPool({ ... });

// Oracle — Thin mode (no Instant Client required, oracledb v6+)
const qz = new Querize('oracle');
await qz.initialize();
const Database = await qz.createPool({ ... });

// Oracle — Thick mode (provide Instant Client path)
const qz = new Querize('oracle');
await qz.initialize({ libDir: '/oracle' });
const Database = await qz.createPool({ ... });
```

> 💡 **Always call `initialize()` regardless of driver — it is the recommended pattern.**  
> Even when using mysql2 or mariadb, the call is a no-op and exits immediately.  
> Fix it in your app startup routine as shown below for portability:
>
> ```javascript
> const qz = new Querize(process.env.DB_DRIVER);
> await qz.initialize({ libDir: process.env.ORACLE_LIB_DIR });
> // → mysql2/mariadb: libDir is ignored, resolves immediately
> // → oracle: initializes in Thick mode
> ```

---

## Connection Modes

Choose how the `Querize` instance manages database connections. All three return `Promise<MQDatabase>`.

### createConnect

**Single direct connection.** Opens a new TCP connection for every operation and closes it when done.  
Best suited for scripts, CLIs, and migration tools where connection overhead is not a concern.

```javascript
const Database = await qz.createConnect({
  alias:    'main',
  host:     'localhost',
  user:     'dbuser',
  password: 'secret',
  database: 'mydb',
});
```

> ⚠️ Avoid in web servers — each request opens and closes its own TCP connection, which is expensive under concurrent load.

---

### createPool

**Connection pool.** Maintains a set of reusable connections. **Recommended for web servers and APIs.**

```javascript
const Database = await qz.createPool({
  alias:           'main',
  host:            'localhost',
  user:            'dbuser',
  password:        'secret',
  database:        'mydb',
  connectionLimit: 10,   // max simultaneous connections
});
```

| Option | Description |
|--------|-------------|
| `alias` | Logical name used for cluster routing |
| `host` | Database server hostname or IP |
| `user` / `password` | Authentication credentials |
| `database` | Default schema |
| `connectionLimit` | Maximum pool size (recommended: 10–50) |
| `dateStrings` | Return DATE/DATETIME columns as strings instead of JS Date objects |
| `supportBigNumbers` | Handle BIGINT columns without precision loss |

---

### createCluster

**Pool cluster.** Groups multiple pools (e.g. primary + replicas) behind a single database object.  
Used for read/write splitting and high-availability setups. Each entry must have a unique `alias`.

```javascript
const Database = await qz.createCluster([
  {
    alias:           'MASTER',
    host:            '10.0.0.1',
    user:            'dbuser',
    password:        'secret',
    database:        'mydb',
    connectionLimit: 5,
  },
  {
    alias:           'SLAVE01',
    host:            '10.0.0.2',
    user:            'dbuser',
    password:        'secret',
    database:        'mydb',
    connectionLimit: 10,
  },
]);
```

Pass `dbmode` to `transaction()` / `singleton()` to route to a specific node.

```javascript
const trx = await Database.transaction('mydb', 'MASTER');  // writes → MASTER
const q   = await Database.singleton('mydb', 'SLAVE01');   // reads  → SLAVE01
```

---

## Operation Modes

Controls how connections are acquired and released during query execution.

### transaction()

Acquires a dedicated connection, executes `BEGIN`, and returns an `MQQuery` instance.  
All subsequent queries through this object run on the **same connection inside the same transaction**.  
You must call `commit()` or `rollback()` explicitly to end the transaction and release the connection.

```javascript
console.log(`# querize : transaction`);
{
  const query = await Database.transaction('example', 'master');

  let result;

  result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();
  console.log('student select1 schid:', result.rows);

  result = await query.table('tbl_student').where({ stdid: 10 }).update({ schid: 10 }).execute();
  console.log('student update1:', result.affected);

  result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();
  console.log('student select2 schid:', result.rows[0].schid);

  result = await query.table('tbl_student').where({ stdid: 10 }).update({ schid: 1 }).execute();
  console.log('student update2:', result.affected);

  result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();
  console.log('student select3 schid:', result.rows[0].schid);

  await query.commit();
}
```

Always wrap in `try/catch` and call `rollback()` on error.

```javascript
const query = await Database.transaction('mydb', 'master');
try {
  await query.table('accounts').where({ id: 1 }).update({ balance: '= balance - 100' }).execute();
  await query.table('accounts').where({ id: 2 }).update({ balance: '= balance + 100' }).execute();
  await query.commit();
} catch (err) {
  await query.rollback();
  throw err;
}
```

**Signature**

```typescript
Database.transaction(dbname?: string, dbmode?: string): Promise<MQQuery>
```

| Parameter | Description |
|-----------|-------------|
| `dbname` | If provided, executes `USE <dbname>` immediately after connecting |
| `dbmode` | Selects a specific cluster node by alias |

---

### singleton()

Returns an `MQQuery` instance.  
Each call to `execute()` **independently** acquires a connection, runs the SQL, and releases it back to the pool.  
There is no persistent connection between calls. Use this for independent, non-transactional queries.

```javascript
const query = await Database.singleton();

// Each execute() uses its own connection
const result1 = await query.table('users').where({ active: 1 }).select().execute();
const result2 = await query.table('orders').where({ user_id: 1 }).select().execute();

console.log(result1.rows);
console.log(result2.rows);
```

**Signature**

```typescript
Database.singleton(dbname?: string, dbmode?: string): Promise<MQQuery>
```

---

## Query API

### Table / JOIN

```javascript
query.table('users')                          // FROM users
query.table('users', 'u')                     // FROM users u  (alias)

query.table('users', 'u')
     .inner('orders', 'o', { 'u.id': 'o.user_id' })   // INNER JOIN

query.table('users', 'u')
     .left('orders', 'o', { 'u.id': 'o.user_id' })    // LEFT OUTER JOIN

query.table('users', 'u')
     .right('orders', 'o', { 'u.id': 'o.user_id' })   // RIGHT OUTER JOIN
```

---

### WHERE

Pass a plain object to `where()`. Keys are column names, values are match conditions.

```javascript
// Equality
query.table('users').where({ id: 1, active: 1 })
// → WHERE (id = 1 AND active = 1)

// Comparison operators — prefix the value with the operator
query.table('orders').where({ amount: '> 1000' })
// → WHERE (amount > 1000)

// OR condition — use an array of objects
query.table('users').where([{ status: 'active' }, { status: 'pending' }])
// → WHERE ((status = 'active') OR (status = 'pending'))

// IS NULL — use literal()
query.table('users').where({ deleted_at: query.literal('IS NULL') })
// → WHERE (deleted_at IS NULL)

// AND / OR chaining
const w = query.table('products').where({ category: 'electronics' });
w.and({ price: '< 500' });
w.or({ featured: 1 });
```

---

### SELECT

```javascript
// All columns
const result = await query.table('users').where({ active: 1 }).select().execute();

// Specific columns
const result = await query.table('users').select('id', 'name', 'email').execute();

// With ORDER BY / GROUP BY / LIMIT
const result = await query
  .table('orders')
  .where({ user_id: 42 })
  .order_by('created_at DESC')
  .limit(0, 20)
  .select('id', 'total')
  .execute();

// FOR UPDATE (use inside a transaction)
const result = await query.table('items').where({ id: 1 }).select().for_update().execute();
```

---

### INSERT

```javascript
// Standard INSERT
const result = await query
  .table('users')
  .insert({ name: 'Alice', email: 'alice@example.com', active: 1 })
  .execute();
console.log(result.affected); // 1
console.log(result.insertId); // generated PK

// INSERT IGNORE
const result = await query
  .table('users')
  .insert({ email: 'bob@example.com' }, { ignore: true })
  .execute();

// Upsert — ON DUPLICATE KEY UPDATE
const result = await query
  .table('user_stats')
  .insert({ user_id: 7, login_count: 1 })
  .on('DUPLICATE', { login_count: '= login_count + 1' })
  .execute();
```

---

### UPDATE

```javascript
// Standard UPDATE
const result = await query
  .table('users')
  .where({ id: 1 })
  .update({ name: 'Bob', email: 'bob@example.com' })
  .execute();
console.log(result.affected); // number of rows changed

// Arithmetic update — prefix value with =
const result = await query
  .table('accounts')
  .where({ id: 1 })
  .update({ balance: '= balance - 100' })
  .execute();
```

---

### DELETE

```javascript
const result = await query
  .table('sessions')
  .where({ user_id: 1 })
  .delete()
  .execute();
console.log(result.affected);
// → DELETE FROM sessions WHERE (user_id = 1)
```

> ⚠️ Calling `.delete()` without `.where()` returns an error query that rejects on `execute()`. (Safety guard)

---

### Modifiers

| Method | Description |
|--------|-------------|
| `.order_by('col ASC')` | ORDER BY |
| `.group_by('col')` | GROUP BY |
| `.limit(count)` | Limit number of rows returned |
| `.limit(offset, count)` | Limit with offset (pagination) |
| `.for_update()` | Append `FOR UPDATE` to SELECT (transaction only) |
| `.on(event, fields)` | Set `ON DUPLICATE KEY UPDATE` fields for INSERT |

---

### Sub-queries

Pass a `MQQuery` instance directly as a table source. Build the sub-query inline on the same `query` object to avoid creating a separate variable — a separate instance could cause a memory leak since it holds its own connector reference.

```javascript
const query = await Database.singleton();

// Build the sub-query inline on the same query instance
const result = await query
  .table('users', 'u')
  .inner(
    query.table('orders').where({ status: 'paid' }).select('user_id', 'SUM(total) AS revenue'),
    'o',
    { 'u.id': 'o.user_id' }
  )
  .select('u.name', 'o.revenue')
  .execute();

console.log(result.rows);
```

> ⚠️ Do **not** create a separate `sub` instance for sub-queries.  
> A separate `MQQuery` instance retains its own connector reference and may cause a memory leak if not properly closed.  
> Always compose sub-queries using the same `query` object.

---

## ResultSet

When `execute()` resolves it returns a **ResultSet object**.  
The available fields depend on the type of query.

### SELECT — `result.rows`

```javascript
const result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();

result.rows;           // full array of row objects
result.rows[0];        // first row
result.rows[0].schid;  // column value
result.rows.length;    // row count

// Example output:
// [
//   { stdid: 10, name: 'Alice', schid: 1 },
//   ...
// ]
```

Handling empty results:

```javascript
const result = await query.table('users').where({ id: 9999 }).select().execute();
if (!result.rows || result.rows.length === 0) {
  console.log('Not found');
} else {
  console.log(result.rows[0].name);
}
```

---

### INSERT / UPDATE / DELETE — `result.affected`

```javascript
// UPDATE
const result = await query
  .table('tbl_student')
  .where({ stdid: 10 })
  .update({ schid: 10 })
  .execute();

result.affected;  // number of rows changed

// INSERT
const result = await query
  .table('users')
  .insert({ name: 'Alice' })
  .execute();

result.affected;  // number of rows inserted
result.insertId;  // generated auto-increment PK
```

---

### ResultSet Field Reference

| Field | Query Type | Description |
|-------|------------|-------------|
| `rows` | SELECT | Array of row objects. Empty result returns `[]`. |
| `rows[n]` | SELECT | The nth row object. Column names are keys. |
| `affected` | INSERT / UPDATE / DELETE | Number of rows affected |
| `insertId` | INSERT | Auto-increment PK of the inserted row. `0` if no AI column. |

---

### Real-world Pattern — ResultSet inside a transaction

```javascript
const query = await Database.transaction('example', 'master');

let result;

// SELECT → read rows
result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();
console.log('select1:', result.rows);           // full array
console.log('schid:',   result.rows[0].schid);  // column access

// UPDATE → check affected
result = await query.table('tbl_student').where({ stdid: 10 }).update({ schid: 10 }).execute();
console.log('update1 affected:', result.affected);

// SELECT again to verify the change
result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();
console.log('select2 schid:', result.rows[0].schid); // 10

// Revert
result = await query.table('tbl_student').where({ stdid: 10 }).update({ schid: 1 }).execute();
console.log('update2 affected:', result.affected);

result = await query.table('tbl_student').where({ stdid: 10 }).select().execute();
console.log('select3 schid:', result.rows[0].schid); // 1

await query.commit();
```

---

## Oracle Driver

Driver identifier: `'oracle'` (uses the `oracledb` package internally)

### Installation

```bash
npm install oracledb

# For Thick mode, install Oracle Instant Client then call:
oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_21_9' });
```

> **Thin vs Thick Mode**  
> oracledb v6+ supports a pure-JS Thin mode that does not require Oracle Instant Client.  
> Use Thick mode only when you need advanced features such as Advanced Queuing or LDAP authentication.

---

### Connection Option

Oracle uses the `database` field for an Easy Connect string or TNS alias instead of a `host`/`port` pair.

```javascript
// Easy Connect
const option = {
  alias:           'main',
  user:            'hr',
  password:        'oracle',
  connectString:   'localhost/XEPDB1',  // <host>/<service_name>
  poolMax:          10,
  poolMin:          0,
  poolIncrement:    1,
  poolTimeout:      30,
  poolPingInterval: 10,
};

// TNS alias (requires tnsnames.ora or TNS_ADMIN env var)
const option = {
  alias:         'prod',
  user:          'app_user',
  password:      'secret',
  connectString: 'PROD_DB',
};
```

---

### Usage Example

```javascript
const qz = new Querize('oracle');
await qz.initialize({ libDir: '/oracle' }); // omit for Thin mode
const Database = await qz.createPool({
  alias: 'main', user: 'hr', password: 'oracle',
  connectString: 'localhost/XEPDB1', poolMax: 10,
});

const query = await Database.singleton();
const result = await query.table('EMPLOYEES').where({ DEPARTMENT_ID: 90 }).select().execute();
console.log(result.rows);
```

---

### Oracle-specific Notes

**Table and column names are UPPERCASE by default** (Oracle default behavior)

```javascript
query.table('EMPLOYEES').where({ DEPARTMENT_ID: 10 }).select('FIRST_NAME', 'SALARY')
```

**DUAL table**

```javascript
const result = await query.table('DUAL').select('SYSDATE').execute();
// → SELECT SYSDATE FROM DUAL
```

**Pagination** — `.limit()` is not supported in Oracle; use raw SQL

```javascript
// Oracle 12c+
const result = await Database.query(
  'SELECT * FROM EMPLOYEES ORDER BY EMPLOYEE_ID FETCH FIRST 20 ROWS ONLY'
);

// Oracle 11g and below
const result = await Database.query(
  'SELECT * FROM (SELECT * FROM EMPLOYEES ORDER BY EMPLOYEE_ID) WHERE ROWNUM <= 20'
);
```

**SEQUENCE (auto-increment substitute)**

```javascript
const result = await query.table('ORDERS').insert({
  ORDER_ID: query.literal('ORDER_SEQ.NEXTVAL'),
  STATUS:   'NEW',
  USER_ID:  42,
}).execute();
```

**Oracle ResultSet field differences**

| Field | Description |
|-------|-------------|
| `rows` | SELECT result array (same shape as mysql2) |
| `affected` | INSERT/UPDATE/DELETE affected row count (mapped from `rowsAffected`) |
| `insertId` | Oracle ROWID string of the inserted row (mapped from `lastRowid`) |

---

## Trace / Logging

```javascript
import { Querize } from 'querize';

Querize.setTrace((level, tag, msg) => {
  console.log(`[${level}] ${tag}: ${msg}`);
});
// level: 'log' | 'err' | 'sql'
```

---

## Connection Mode Summary

| Mode | Connection Handling | Best For |
|------|---------------------|----------|
| `createConnect` | New TCP connection per operation | Scripts, CLIs, migrations |
| `createPool` | Reusable connection pool | Web servers, APIs (recommended default) |
| `createCluster` | Multiple pools as one object | Read/write splitting, HA setups |
| `transaction()` | Dedicated connection + BEGIN | Multi-statement atomicity |
| `singleton()` | Acquire → execute → release per call | Independent single queries |

---

## License

MIT © 2020 lClasser — [Querize](https://github.com/itfin-git/Querize)
