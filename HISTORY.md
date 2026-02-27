1.1.4 / 2026-02-27
* Added an option argument to the createPool function
    createPool(config, option : {
        defaultDatabase : 'Default database for singleton and transaction contexts'
    })

1.1.3 / 2026-02-27
========================
* Add isEmpty() to ResultSet

1.1.2 / 2026-02-26
========================
* Handle select arguments as a one-dimensional array

1.1.1 / 2026-02-26
========================
* Add alias support to the database configuration when using poolCluster

1.1.0 / 2026-02-26
========================
* Returns the query result in ResultSet format
    {
        insertId: any;    // (Optional) The last inserted ID in MariaDB/MySQL
        affected: number; // Number of affected rows (INSERT, UPDATE, DELETE)
        rows: any[];      // SELECT result (always returned as an array of objects)
        meta: any;        // Original driver response (kept for reference if needed)
    }

1.0.9 / 2026-02-25
========================
* Remove MQDriver.option and change its type to any.
* Update oracledb to support multiple connection pools.
* generateConfig() add. display for sample-config.

1.0.8 / 2026-02-24
========================
* Add Oracle Database driver

1.0.5 / 2025-11-03
========================
* Fix crash when where() argument is null

1.0.0 / 2025-09-05
========================
* Initial release
* TypeScript Support

0.0.9 / 2020-12-11
========================
* Initial Development
