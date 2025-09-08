# Querize.js

A modern TypeScript/JavaScript query builder and database abstraction layer that provides a fluent interface for building and executing SQL queries across different database drivers.

## Features

- 🔥 **TypeScript Support** - Built with TypeScript for better type safety
- 🚀 **Multiple Connection Types** - Support for single connections, connection pools, and clusters
- 🔄 **Transaction Management** - Built-in transaction support with commit/rollback
- 📝 **Query Builder** - Fluent API for building complex SQL queries
- 🔌 **Driver Abstraction** - Pluggable driver system for different databases
- 🎯 **Promise-based** - Modern async/await support
- 🔒 **Database Locking** - Built-in support for named locks

## Installation

### npm
```bash
npm install querize
```

### yarn
```bash
yarn add querize
```

### pnpm
```bash
pnpm add querize
```

## Quick Start (typescript)

```typescript
import Querize from 'querize';

// Create a database instance
const querize = new Querize('mysql'); // or your preferred driver

// Create a connection pool
const database = await querize.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb'
});

// Simple query
const users = await database
    .singleton()
    .then(query => query
        .table('users')
        .where({'active' : 1})
        .select('id', 'name', 'email')
        .execute()
    );

```
## Quick Start (javascript)

```typescript
const Querize = require('querize');

// Create a database instance
const querize = new Querize('mysql'); // or your preferred driver

// Create a connection pool and query
querize.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb'
})
.then(function(database) {
    return database.singleton()
})
.then(function(query) {
    return query.table('users')
    .where({'active' : 1})
    .select('id', 'name', 'email')
    .execute()
});
```

## Connection Types

### Single Connection
- **Behavior**: Creates a new connection for each query and closes it immediately after execution.  
- **Flow**:  
  SQL → execute → connect → query → disconnect → SQL → ...
- **Notes**: Very simple, but repeatedly opening and closing connections can cause performance overhead.
```typescript
const database = await querize.createConnect(options);
```

### Connection Pool
- **Behavior**: Uses a connection pool where multiple queries can reuse existing connections.  
- **Flow**:  
  SQL → execute → connect → query → SQL → ...
- **Notes**: More efficient for high-frequency queries since connections are reused instead of created and destroyed each time.
```typescript
const database = await querize.createPool(options);
```

### Cluster
- **Behavior**: Manages multiple database instances and selectively connects to one depending on the query.  
- **Flow**:  
  SQL → execute → connect [choose DB] → query → SQL → ...
- **Notes**: Useful in multi-database environments for load balancing or failover scenarios.
```typescript
const database = await querize.createCluster([option1, option2, ...]);
```

### Query-only (for Debug)
- **Notes**: Method to inspect the SQL string of a query.
```typescript
const database = await querize.createQuery();
```

## Transaction Types

### `Singleton`
- **Behavior**: Each connection handles only a single SQL statement at a time.  
- **Use case**: Simplifies query execution when only one statement per connection is required.

### `Transaction`
- **Behavior**: A single connection is used for multiple statements until an explicit `COMMIT` or `ROLLBACK` is executed.  
- **Use case**: Ensures atomic operations and consistency across multiple queries.

## Usage Examples

### Basic Queries

#### SELECT
```typescript
// Simple select
const users = await database.singleton()
    .then(q => q.table('users')
        .select()
        .execute());

// Select with conditions
const activeUsers = await database.singleton()
    .then(q => q.table('users')
        .where({
            'active' : 1,
            'created_at', "> '2023-01-01'"
        })
        .select('id', 'name', 'email')
        .execute());

// Select with joins
const userPosts = await database.singleton()
    .then(q => q.table('users', 'u')
        .inner('posts', 'p', {'u.id = p.user_id'})
        .select('u.name', 'p.title')
        .execute());
```

#### INSERT
```typescript
const result = await database.singleton()
    .then(q => q.table('users')
        .insert({
            name: 'John Doe',
            email: 'john@example.com',
            active: 1
        })
        .execute());

// Insert with ON DUPLICATE KEY UPDATE
const result = await database.singleton()
    .then(q => q.table('users')
        .insert({
            name: 'John Doe',
            email: 'john@example.com'
        }, { ignore: false })
        .on('DUPLICATE', { updated_at: new Date() })
        .execute());
```

#### UPDATE
```typescript
const result = await database.singleton()
    .then(q => q.table('users')
        .where({'id' : 1})
        .update({
            name: 'Jane Doe',
            updated_at: new Date()
        }));
```

#### DELETE
```typescript
const result = await database.singleton()
    .then(q => q.table('users')
        .where({'active' : 0})
        .delete());
```

### Advanced Features

#### Transactions
```typescript
const transaction = await database.transaction();

try {
    await transaction.table('users')
        .insert({ name: 'John', email: 'john@example.com' })
        .execute();
    
    await transaction.table('user_profiles')
        .insert({ user_id: 1, bio: 'Hello world' })
        .execute();
    
    await transaction.commit();
} catch (error) {
    await transaction.rollback();
    throw error;
}
```

#### Subqueries
```typescript
const query = await database.singleton()
const result = await query.table('users')
.left('order', query.table('orders')
    .where({'status' : 'completed'})
    .select('user_id'), {
        'order.user_id' : '= users.id'
    }
)
.where({'id' : 'john'})
.select()
.execute();
```

#### Joins
```typescript
const result = await query.table('users', 'u')
.left('profiles', 'p', {'u.id = p.user_id'})
.right('settings', 's', {'u.id = s.user_id'})
.select('u.name', 'p.bio', 's.theme')
.execute();
```

#### Grouping and Ordering
```typescript
const stats = await query.table('orders')
.group_by('status')
.order_by('count DESC')
.select('status', 'COUNT(*) as count')
.execute();
```

#### Pagination
```typescript
// Limit only
const recent = await query.table('posts')
.order_by('created_at DESC')
.limit(10)
.select()
.execute();

// Offset and limit
const page2 = await query.table('posts')
.order_by('created_at DESC')
.limit(10, 10) // offset 10, limit 10
.select()
.execute();
```

#### Database Locking
```typescript
const query = await database.transaction();

try {
    // Acquire lock
    await query.lock('user_update', 30); // 30 second timeout
    
    // Do critical operations
    await query.table('users')
        .where('id', 1)
        .update({ balance: 1000 })
        .execute();
    
    // Release lock
    await query.unlock('user_update');
    
    await query.commit();
} catch (error) {
    await query.rollback();
}
```

## Configuration

### Database Options
```typescript
interface MQOption {
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    charset?: string;
    timeout?: number;
    // ... other driver-specific options
}
```

### Debugging
Enable query logging:
```typescript
import { setTrace } from 'querize';

setTrace((message) => {
    console.log('[Querize]', message);
});
```

## Error Handling

```typescript
try {
    const result = await database.singleton()
        .then(q => q.table('users')
            .select()
            .execute());
} catch (error) {
    console.error('Query failed:', error);
}
```

# Query Builder – `where()`

The `where()` method is used to build **SQL WHERE conditions** in a declarative way.
It accepts **objects** or **arrays of objects** as input and supports `AND` / `OR` composition.
You can also use `query.literal()` to safely insert raw SQL fragments when necessary.

---

## Signature

```ts
where(...clauses: (object | object[])[]): MQWhere

// Start a grouped condition
query.where(...clauses: (object | object[])[]): MQWhere

// Add OR conditions to a group
MQWhere.or(...clauses: (object | object[])[]): MQWhere
```

---

## Value Rules

* **Single value** → equals (`=`)

  ```js
  .where({ user_id: 1 }) // user_id = 1
  ```
* **Operator string** → used as-is
  (`"> 0"`, `"<>'H'"`, `"= other.col"`)

  ```js
  .where({ amount: '> 1000' }) // amount > 1000
  ```
* **Array** → `IN (...)`

  ```js
  .where({ status: ['ACTIVE', 'INACTIVE'] }) // status IN ('ACTIVE','INACTIVE')
  ```
* **Array + literal** → multiple alternatives (e.g., including `NULL`)

  ```js
  .where({ account_id: [123, query.literal('IS NULL')] })
  // account_id = 123 OR account_id IS NULL
  ```
* **`query.literal(sql)`** → raw SQL fragment (for LIKE, IS NULL, etc.)

---

## Combination Rules

* Multiple arguments → **AND**

  ```js
  .where({ a: 1 }, { b: 2 }) // a=1 AND b=2
  ```

* Fields in an object → **AND**

  ```js
  .where({ a: 1, b: 2 }) // a=1 AND b=2
  ```

* Array of objects → **OR**

  ```js
  .where([{ a: 1 }, { b: 2 }]) // (a=1 OR b=2)
  ```

---

## Examples

### Equality

```js
.where({ user_id: 100 }) // user_id = 100
```

### Date range

```js
.where(
  { created_at: '>= "2025-01-01"' },
  { created_at: '<= "2025-01-31"' },
) // created_at >= "2025-01-01" AND created_at <= "2025-01-31"
```

### Allow NULL

```js
.where({ account_id: [body.account_id, query.literal('IS NULL')] })
// account_id = '...' OR account_id IS NULL
```

### OR group

```js
.where([
  { account_type: 'SAVINGS' },
  { account_type: 'ASSET' },
])
// account_type = 'SAVINGS' OR account_type = 'ASSET'
```

### LIKE search

```js
.where([
  { title: query.literal("LIKE '%keyword%'") },
  { memo : query.literal("LIKE '%keyword%'") },
])
// title LIKE '%keyword%' OR memo LIKE '%keyword%'
```

### Group + OR extension

```js
let dateRange = query.where(
  { t.date: '>= "2025-01-01"' },
  { t.date: '<= "2025-01-31"' },
);

// Include overlapping installment period
dateRange = dateRange.or({
  t.date   : '<= "2025-01-31"',
  t.end_date: '>= "2025-01-01"',
});
// (t.date >= "2025-01-01" AND t.date <= "2025-01-31")
// OR 
// (t.date <= "2025-01-31" AND t.end_date >= "2025-01-01")
```

---

## Full Example – **Monthly Transaction List**

```js
query.table('transactions', 't')
 .left('accounts', 'a', {
   'a.user_id'     : req.session.user_id,
   'a.account_id'  : '= t.account_id',
   'a.account_type': ['SAVINGS','ASSET'],
 })
 .where(
   // User condition
   { 't.user_id': req.session.user_id },

   // Date range
   { 't.date': '>= "2025-01-01"' },
   { 't.date': '<= "2025-01-31"' },

   // Account check (include NULL)
   {
     'a.account_id'  : ['= t.account_id', query.literal('IS NULL')],
     'a.account_type': ['SAVINGS','ASSET', query.literal('IS NULL')],
   },
 )
 .order_by('t.date', 't.time', 't.description')
 .select([
   'a.account_name   AS Account',
   't.currency       AS Currency',
   't.amount         AS Amount',
   't.description    AS Description',
   't.date           AS Date',
   't.time           AS Time',
   't.category_code  AS CategoryCode',
   't.memo           AS Memo',
 ])
 .execute();
```

```sql
SELECT 
  a.account_name AS Account, 
  t.currency AS Currency, 
  t.amount AS Amount, 
  t.description AS Description, 
  t.date AS Date, 
  t.time AS Time, 
  t.category_code AS CategoryCode, 
  t.memo AS Memo 
FROM 
  transactions AS t 
  LEFT OUTER JOIN accounts AS a ON (
    a.user_id = 'tester' AND a.account_id = t.account_id 
    AND (a.account_type = 'SAVINGS' OR a.account_type = 'ASSET')
  ) 
WHERE 
  (
    (t.user_id = 'tester') 
    AND (t.date >= "2025-01-01") 
    AND (t.date <= "2025-01-31") 
    AND (
      (a.account_id = t.account_id OR a.account_id IS NULL) 
      AND (
        a.account_type = 'SAVINGS' OR a.account_type = 'ASSET' OR a.account_type IS NULL
      )
    )
  ) 
ORDER BY 
  t.date, 
  t.time, 
  t.description
```

---

## Quick Reference

| Pattern         | Example                             | SQL Result               |
| --------------- | ----------------------------------- | ------------------------ |
| Single value    | `{ col: 1 }`                        | `col = 1`                |
| Operator string | `{ amt: '> 0' }`                    | `amt > 0`                |
| IN              | `{ type: ['S','A'] }`               | `type IN ('S','A')`      |
| NULL include    | `{ k: [val, literal('IS NULL')] }`  | `k=val OR k IS NULL`     |
| LIKE            | `{ memo: literal("LIKE '%foo%'") }` | `memo LIKE '%foo%'`      |
| OR group        | `where([{A}, {B}])`                 | `(A OR B)`               |
| Group OR        | `where({A}).or({B}, [{C},{D}])`     | `(A) OR (B) OR (C OR D)` |

---

## Best Practices

* Use **objects and arrays** as much as possible for clarity.
* Reserve `query.literal()` only for cases that **cannot be expressed as values** (e.g., `LIKE`, `IS NULL`, functions).
* Always prefer **date range queries** (`>= start AND <= end`) for better index usage.
* Use **object arrays** for OR conditions to keep code clean.





## Best Practices

1. **Always use transactions for multiple related operations**
2. **Clean up connections when done**
3. **Use connection pools for better performance**
4. **Handle errors appropriately**
5. **Use parameterized queries to prevent SQL injection**

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/itfin/querize/issues) page.
