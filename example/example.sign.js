const NodeExpress   = require('express');
const NodeHttp      = require("http");
const Querize       = require('querize');

const NodeApp       = NodeExpress();
const querize = new Querize('mariadb');

Querize.setTrace(function(type, title, mesg) {
    console.log("Querize:", `${type}:${title}:${mesg}`);
});

NodeApp.use(NodeExpress.json({ limit: '50mb' }));
NodeApp.use(NodeExpress.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));

NodeApp.post("/signin", function(req, res) {
    const body = ({ id = '', pwd = '' } = req.body || {}) && { id, pwd };
    return NodeExpress.Database.singleton()
    .then(function(_uery) {
        // select user-table 
        return _uery.table('user')
        .where(body)
        .select()
        .execute()
        .then(function(rows) {
            res.json((rows && rows[0]) || {});
        });
    })
    .catch(function(err) {
        res.json({error: err});
    })
});

NodeApp.post("/signup", function(req, res) {
    const body = ({ id = '', pwd = '', alias = '' } = req.body || {}) && { id, pwd, alias };

    let query;
    return NodeExpress.Database.transaction()
    .then(function(_uery) {
        query = _uery;
    })
    // insert auth-table for grade or level
    .then(function() {
        return query.table('auth')
        .isnert({
            id : body.id,
            auth : 10,
        })
        .execute();
    })
    // insert user-table
    .then(function() {
        return query.table('user')
        .isnert(body)
        .execute();
    })
    // success to commit
    .then(function() {
        query && query.commit().then(function() {
            res.json((rows && rows[0]) || {});
        });
    })
    // error to rollback
    .catch(function(err) {
        query && query.rollback().then(function() {
            res.json({error: err});
        });
    });
});

Promise.resolve().then(function() {
    console.log("creating Databse.");
    return querize.createPool({
        host    : "127.0.0.1",
        user    : "tester",
        password: "tested",
        database: "testing",
        acquireTimeout: 3000,
        connectionLimit: 10,        // 한 번에 생성할 수 있는 최대 커넥션 수.
        idleTimeout: 30000,          // 풀 커넥션이 해제되기까지의 유휴 시간.
    })
    .then(function(Database) {
        console.log("created Databse.");
        NodeExpress.Database = Database;
    });
})
.then(new Promise(function(resolve) {
    let http_port = 3030;
    NodeHttp.createServer(NodeApp).listen(http_port, function () {
        console.log(`listening at ${http_port}`);
        resolve();
    });
}))
.then(function() {
    console.log(`server running...`);
})
.catch(function(err) {
    console.error("error:", err);
});
