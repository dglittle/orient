
var _ = require('gl519')

defaultEnv = function (key, val) {
    if (!process.env[key])
        process.env[key] = val
}

process.on('uncaughtException', function (err) {
    try {
        console.log(err)
        console.log(err.stack)
    } catch (e) {}
})

dbEval = function (db, func) {
    return _.p(db.runCommand({
        eval : '' + func,
        args : _.toArray(arguments).slice(2),
        nolock : true
    }, _.p())).retval
}
