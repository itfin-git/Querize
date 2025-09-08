const NodeExpress   = require('express');
const NodeHttp      = require("http");
const Querize       = require('querize');

const NodeApp       = NodeExpress();
const querize = new Querize('query');

NodeApp.use(NodeCompress());
NodeApp.use(NodeCookie());
NodeApp.use(NodeExpress.json({ limit: '50mb' }));
NodeApp.use(NodeExpress.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));

NodeApp.post("/signin", function(req, res) {
    const body = ({ id = '', pwd = '' } = req.body || {}) && { id, pwd };
    return NodeExpress.Database.query('user')
    .where(body)
    .select()
    .execute()
    .then(function(rows) {
        res.json((rows && rows[0]) || {});
    });
});

NodeApp.post("/signup", function(req, res) {
    const body = ({ id = '', pwd = '', alias = '' } = req.body || {}) && { id, pwd, alias };
    return NodeExpress.Database.query('user')
    .isnert(body)
    .execute()
    .then(function(rows) {
        res.json((rows && rows[0]) || {});
    });
});

Promise.resolve()
.then(function() {
    return querize.createPool({
        host    : "127.0.0.1",
        user    : "example",
        password: "example",
        database: "example",
    })
    .then(function(Database) {
        NodeExpress.Database = Database;
    });
})
.then(new Promise(function(resolve) {
    let https_server = NodeHttp.createServer(NodeApp);
    https_server.listen(EnvConfig.http_port, function () {
        console.log(`listening at ${EnvConfig.http_port}`);
        resolve();
    });
}))
.then(function() {
    console.log(`server running...`);
});
