const Querize       = require('querize');

console.log("Querize:", Querize);

const querize = new Querize('query');

Querize.setTrace(function(type, title, mesg) {
    console.log(`${type}:${title}:${mesg}`);
});

var Database;

querize.createQuery().then(function(database) {
    console.log(`createQuery connected:`);
    Database = database;
})
// singleton
.then(function() {
    var tuery;
    console.log(`#######################################################################################################:`);
    console.log(`# singleton:`);
    return Database.singleton().then(function(_query) {
        tuery = _query;
    })
    .then(function() {
        return tuery.table('SINGLETON_1', 'ST1')
        .where({ vsvr_key : 'vsvr_key', })
        .select()
        .execute()
        .then(function(rows) {
            console.log("rows:", rows);
        });
    })
    .then(function() {
        console.log(`----------------------------------------------------------------------------------------------------`);
        return tuery.table('SINGLETON_2')
        .where({ vsvr_key : 'vsvr_key', })
        .select()
        .execute()
        .then(function(rows) {
            console.log("rows:", rows);
        });
    })
    .then(function() {
        return tuery && tuery.commit().then(function() { tuery = null; });
    });
})
.then(function() {
    console.log(`#######################################################################################################:`);
    console.log(`# singleton 2:`);
    Database.singleton().then(function(_query) {
        return _query.table('transactions', 't')
        .left('accounts', 'a', {
            'a.user_id'     : 'tester',
            'a.account_id'  : '= t.account_id',
            'a.account_type': ['SAVINGS','ASSET'],
        })
        .where(
            // User condition
            { 't.user_id': 'tester' },

            // Date range
            { 't.date': '>= "2025-01-01"' },
            { 't.date': '<= "2025-01-31"' },

            // Account check (include NULL)
            {
                'a.account_id'  : ['= t.account_id', _query.literal('IS NULL')],
                'a.account_type': ['SAVINGS','ASSET', _query.literal('IS NULL')],
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
    });
})
.then(function() {
    return Database.singleton();
})
.then(function(query) {
    console.log(`#######################################################################################################:`);
    console.log(`# singleton 3:`);
    return query.table('users')
    .left('order', query.table('orders')
        .where({'status' : 'completed'})
        .select('user_id'), {
            'order.user_id' : '= users.id'
        }
    )
    .where(null, null, {'id' : 'john'})
    .select()
    .execute();
})
;