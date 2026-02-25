const Querize       = require('querize');

console.log("Querize:", Querize);

const querize = new Querize('oracledb');

/*
-- 학생
CREATE TABLE IF NOT EXISTS `TBL_STUDENT` (
  `stdid`   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'student unique id',
  `schid`   INT UNSIGNED NOT NULL               COMMENT 'school unique id',
  `name`    VARCHAR(32)  NOT NULL               COMMENT 'student name',
  `address` VARCHAR(256) NULL                   COMMENT 'student address',
  PRIMARY KEY (`stdid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (1, 1, 'Alice',   'A-101'), (2, 1, 'Bob',     'A-102');
INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (3, 2, 'Carol',   'B-201'), (4, 2, 'Dave',    'B-202');
*/

querize.generateConfig('createConnect').then(config => console.log("oracle-config:", config));
querize.initialize({
    libDir: "C:\\Temp\\test\\oracle\\instantclient-basic-windows.x64-23.26.1.0.0\\instantclient_23_0",
})
.then(function() {
    return querize.createConnect({
        // alias : string,         // transaction,singleton 시 찾을 이름
        host : "127.0.0.1",          // DB ip
        user : "exuser",          // DB user
        password : "exuser",      // DB password
        database : "example",      // DB database
        checkDuplicate: false,
    })
    .then(function(database) {
        let query = null;
        return database.singleton()
        .then(function(_query) {
            query = _query;
        })
        .then(function() {
            return query.table('tbl_student', 'student')
            .select()
            .execute()
            .then(function(rows) {
                console.log("rows:", rows);
            })
            .catch(function(err) {
                console.log("err:", err);
            });
        });
    });
})
.catch(err => {
    console.log("error:", err);
    console.log("==============================");
});
