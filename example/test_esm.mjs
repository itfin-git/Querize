
import Querize from 'querize';

Querize.setTrace(function(type, title, mesg) {
    console.log("Querize:", `${type}:${title}:${mesg}`);
});

const querize = new Querize('mariadb');

/*
table: TBL_SCHOOL
schid       integer         school unique id
school      varchar(32)     school-name
address     varchar(256)    school address

table: TBL_STUDENT
stdid       integer         student unique id
schid       integer         school unique id
name        varchar(32)     student name
address     varchar(256)    student address


table: TBL_CLASS
clsid       integer         class unique id
school      varchar(32)     school-name
class       integer         school class

table: TBL_SCORE
stdid       integer         student unique id
clsid       integer         class unique id
score       integer         class score

-- 학교
CREATE TABLE IF NOT EXISTS `TBL_SCHOOL` (
  `schid`   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'school unique id',
  `school`  VARCHAR(32)  NOT NULL                COMMENT 'school-name',
  `address` VARCHAR(256) NULL                    COMMENT 'school address',
  PRIMARY KEY (`schid`),
  UNIQUE KEY `uk_school_name` (`school`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생
CREATE TABLE IF NOT EXISTS `TBL_STUDENT` (
  `stdid`   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'student unique id',
  `schid`   INT UNSIGNED NOT NULL               COMMENT 'school unique id',
  `name`    VARCHAR(32)  NOT NULL               COMMENT 'student name',
  `address` VARCHAR(256) NULL                   COMMENT 'student address',
  PRIMARY KEY (`stdid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 반/클래스
CREATE TABLE IF NOT EXISTS `TBL_CLASS` (
  `clsid`  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'class unique id',
  `school` VARCHAR(32)  NOT NULL               COMMENT 'school-name',
  `class`  INT          NOT NULL               COMMENT 'school class',
  PRIMARY KEY (`clsid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 성적
CREATE TABLE IF NOT EXISTS `TBL_SCORE` (
  `stdid` INT UNSIGNED NOT NULL COMMENT 'student unique id',
  `clsid` INT UNSIGNED NOT NULL COMMENT 'class unique id',
  `score` INT          NOT NULL COMMENT 'class score',
  PRIMARY KEY (`stdid`, `clsid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1) 학교 3개
INSERT INTO `TBL_SCHOOL` (`schid`, `school`, `address`) VALUES
  (1, 'Alpha High',        '123 Alpha St'),
  (2, 'Beta Middle',       '456 Beta Ave'),
  (3, 'Gamma Elementary',  '789 Gamma Rd');

-- 2) 클래스 4개 (학교명 문자열 FK 주의: TBL_SCHOOL.school 과 동일해야 함)
INSERT INTO `TBL_CLASS` (`clsid`, `school`, `class`) VALUES
  (1, 'Alpha High',       1),
  (2, 'Alpha High',       2),
  (3, 'Beta Middle',      1),
  (4, 'Gamma Elementary', 3);

-- 3) 학생 1~2
INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (1, 1, 'Alice',   'A-101'), (2, 1, 'Bob',     'A-102');
INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (3, 2, 'Carol',   'B-201'), (4, 2, 'Dave',    'B-202');
INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (5, 1, 'Eve',     'A-103'), (6, 1, 'Frank',   'A-104');
INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (7, 3, 'Grace',   'G-301'), (8, 3, 'Heidi',   'G-302');
INSERT INTO `TBL_STUDENT` (`stdid`, `schid`, `name`, `address`) VALUES (9,  2, 'Ivan',   'B-203'), (10, 1, 'Judy',   'A-105');
INSERT INTO `TBL_SCORE` (`stdid`, `clsid`, `score`) VALUES (1, 1, 95), (2, 1, 88), (3, 3, 90), (4, 3, 76);
INSERT INTO `TBL_SCORE` (`stdid`, `clsid`, `score`) VALUES (5, 2, 84), (6, 2, 91), (7, 4, 87);
INSERT INTO `TBL_SCORE` (`stdid`, `clsid`, `score`) VALUES (8, 4, 92), (9, 1, 63), (10, 2, 78);

INSERT INTO `TBL_SCORE` (`stdid`, `clsid`, `score`) VALUES (1, 2, 85), (2, 2, 78), (3, 2, 80), (4, 2, 66);

*/

let Database = await querize.createPool({
    // alias : string,         // transaction,singleton 시 찾을 이름
    host : "127.0.0.1",          // DB ip
    user : "exuser",          // DB user
    password : "exuser",      // DB password
    database : "example",      // DB database
    checkDuplicate: false,
});
console.log(`createPool connected:`);

console.log(`#######################################################################################################:`);
console.log(`# querize : Single-use connection; single query`);
{
    let rows = await Database.query("SELECT * FROM tbl_school");
    console.log(`rows:`, rows && rows[0]);
}
console.log(``);

console.log(`#######################################################################################################:`);
console.log(`# querize : One connection per query`);
{
    let query = await Database.singleton('example', 'master')
    let rows = await query.table('tbl_student', 'student')
        .left('score', 
            query.table('tbl_score')
            .group_by('stdid')
            .select('stdid, sum(score) AS point', 'count(score) as count'),
            { "score.stdid" : "= student.stdid" }
        )
        .select()
        .execute()
    ;
    console.log("rows[0]:", rows && rows[0]);
}
console.log(``);


console.log(`#######################################################################################################:`);
console.log(`# querize : transaction`);
{
    let query = await Database.transaction('example', 'master')

    let result;
    result = await query.table('tbl_student').where({stdid : 10}).select().execute();
    console.log("student select1 schid:", result.rows);

    result = await query.table('tbl_student').where({stdid : 10}).update({ schid : 10, }).execute();
    console.log("student update1:", result.affected);

    result = await query.table('tbl_student').where({stdid : 10}).select().execute();
    console.log("student select2 schid:", result.rows[0].schid);

    result = await query.table('tbl_student').where({stdid : 10}).update({ schid : 1, }).execute();
    console.log("student update2:", result.affected);

    result = await query.table('tbl_student').where({stdid : 10}).select().execute();
    console.log("student select3 schid:", result.rows[0].schid);

    await query.commit();
}
console.log(``);
;

await Database.destroy();
