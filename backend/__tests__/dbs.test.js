const mysql = require("mysql");
const db = require("../dbs");
jest.mock("mysql");

describe('Testing dbs connectToDb()', () => {
  var dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    port: "3306"
  };

  it('Db connected successfully', async () => {
    expect.assertions(2);
    var sqlCon = { connect: (func) => {func()}, on: (type, func) => {} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await expect(db.connectToDb()).resolves.toEqual(undefined);
    expect(mysql.createConnection).toHaveBeenCalledWith(dbConfig);
  });

  it('Db connection failed', async () => {
    expect.assertions(2);
    var sqlFailedCon = { connect: (func) => { func("Connection failed") }, on: (type, func) => {}  };
    mysql.createConnection.mockReturnValue(sqlFailedCon);
    await expect(db.connectToDb()).rejects.toMatch("Connection failed");
    expect(mysql.createConnection).toBeCalledWith(dbConfig);
  });

  it('Db connection error', async () => {
    expect.assertions(2);
    var sqlErrorCon = { connect: (func) => {setTimeout(3000, func)}, on: (type, func) => {func("ERROR")}  };
    mysql.createConnection.mockReturnValue(sqlErrorCon);
    await expect(db.connectToDb()).rejects.toMatch("ERROR");
    expect(mysql.createConnection).toBeCalledWith(dbConfig);
  });
})

describe('Testing dbs initializeDatabase()', () => {
  it('Db initialized successfully', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func()},
                changeUser: (dbName, func) => {func()}  };
    mysql.createConnection.mockReturnValue(sqlCon);

    expect.assertions(1);
    await expect(db.initializeDb()).resolves.toEqual(undefined);
  });

  it('Db connection failed', async () => {
    sqlCon = { connect: (func) => { func("Connection failed") },
                on: (type, func) => {},
                query: (qString, func) => {func()},
                changeUser: (dbName, func) => {func()}  };
    mysql.createConnection.mockReturnValue(sqlCon);

    expect.assertions(1);
    await expect(db.initializeDb()).rejects.toMatch("Connection failed");
  });

  it('Db creation failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {if(qString.includes("DATABASE")) {
                                              func("Error creating Db!");
                                            } else {
                                              func();
                                            }},
                changeUser: (dbName, func) => {func()}  };
    mysql.createConnection.mockReturnValue(sqlCon);

    expect.assertions(1);
    await expect(db.initializeDb()).rejects.toMatch("Error creating Db!");
  });

  it('Switching db failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func();},
                changeUser: (dbName, func) => {func("Error changing database!")}  };
    mysql.createConnection.mockReturnValue(sqlCon);

    expect.assertions(1);
    await expect(db.initializeDb()).rejects.toMatch("Error changing database!");
  });

  it('Table creation failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {if(qString.includes("TABLE")) {
                                              func("Error creating Table!");
                                            } else {
                                              func();
                                            }},
                changeUser: (dbName, func) => {func()}  };
    mysql.createConnection.mockReturnValue(sqlCon);

    expect.assertions(1);
    await expect(db.initializeDb()).rejects.toMatch("Error creating Table!");
  });
})

describe('Testing dbs createDatabase()', () => {
  it('Db created and switched to successfully', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func()},
                changeUser: (dbName, func) => {func()}  };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.createDatabase()).resolves.toEqual(undefined);
  });
  it('Db creation failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Error creating Db!")},
                changeUser: (dbName, func) => {func()}  };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.createDatabase()).rejects.toMatch("Error creating Db!");
  });

  it('Db creation success, changing database failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func()},
                changeUser: (dbName, func) => {func("Error changing database!")}  };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.createDatabase()).rejects.toMatch("Error changing database!");
  });
})

describe('Testing dbs createTable()', () => {
  it('Table created successfully', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func()} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.createTable()).resolves.toEqual(undefined);
  });

  it('Table creation failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Table creation failed!")} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.createDatabase()).rejects.toMatch("Table creation failed!");
  });
})

describe('Testing dbs loadTable()', () => {
  it('Table loaded successfully', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func()} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.loadTable()).resolves.toEqual(undefined);
  });

  it('Table loading failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Load Data failed!")} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.loadTable()).rejects.toMatch("Load Data failed!");
  });
})

describe('Testing dbs clearTable()', () => {
  it('Table cleared successfully', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func()} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.clearTable()).resolves.toEqual(undefined);
  });

  it('Table clear failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Clear table failed!")} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.clearTable()).rejects.toMatch("Clear table failed!");
  });
})

describe('Testing dbs checkLastUpdate()', () => {
  it('checkLastUpdate retrieved successfully', async () => {
    var returnObj = {createdAt: new Date().toString()};
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func(null, [returnObj])} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.checkLastUpdate()).resolves.toEqual(returnObj);
  });

  it('checkLastUpdate error', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Error on query!", [])} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.checkLastUpdate()).rejects.toMatch("Error on query!");
  });

  it('checkLastUpdate retrieved successfully, no return', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func(null, [])} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.checkLastUpdate()).rejects.toMatch("No results found");
  });
})

describe('Testing dbs sendQuery()', () => {
  it('sendQuery success', async () => {
    var returnObj = "Query Success";
    var queryString = null;
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {
                    queryString = qString;
                    func(null, returnObj);
                  } };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(3);
    await expect(db.sendQuery(0, 10, 0, 10)).resolves.toEqual(returnObj);
    expect(queryString).toEqual(expect.not.stringContaining("AND year >="));
    expect(queryString).toEqual(expect.stringContaining("SELECT type, year, x, y FROM"));
  });

  it('sendQuery success with year', async () => {
    var returnObj = "Query Success";
    var queryString = null;
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {
                    queryString = qString;
                    func(null, returnObj);
                  } };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(3);
    await expect(db.sendQuery(0, 10, 0, 10, 1997)).resolves.toEqual(returnObj);
    expect(queryString).toEqual(expect.stringContaining("AND year >="));
    expect(queryString).toEqual(expect.stringContaining("SELECT type, year, x, y FROM"));
  });

  it('sendQuery failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {
                            func("Query failed!", null)
                          } };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.sendQuery(0, 10, 0, 10)).rejects.toMatch("Query failed!");
  });
})

describe('Testing dbs getAllQuery()', () => {
  it('getAllQuery success', async () => {
    var returnObj = "Query Success";
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func(null, returnObj)} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.getAllQuery()).resolves.toEqual(returnObj);
  });

  it('getAllQuery failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Query failed!", null)} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    expect.assertions(1);
    await expect(db.getAllQuery()).rejects.toMatch("Query failed!");
  });
})
