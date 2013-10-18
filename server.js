
var _ = require('gl519')
require('./nodeutils.js')

_.run(function () {

    defaultEnv("PORT", 5000)
    defaultEnv("HOST", "http://localhost:" + process.env.PORT)
    defaultEnv("NODE_ENV", "production")
    defaultEnv("MONGOHQ_URL", "mongodb://localhost:27017/orient")
    defaultEnv("SESSION_SECRET", "super_secret")

    var db = require('mongojs').connect(process.env.MONGOHQ_URL)

    var express = require('express')
    var app = express()
    
    _.serveOnExpress(express, app)

    app.use(express.cookieParser())
    app.use(function (req, res, next) {
        _.run(function () {
            req.body = _.consume(req)
            next()
        })
    })

    var MongoStore = require('connect-mongo')(express)
    app.use(express.session({
        secret : process.env.SESSION_SECRET,
        cookie : { maxAge : 10 * 365 * 24 * 60 * 60 * 1000 },
        store : new MongoStore({
            url : process.env.MONGOHQ_URL,
            auto_reconnect : true,
            clear_interval : 3600
        })
    }))

    app.use(function (req, res, next) {
        if (req.query.workerId)
            req.session.user = 'mturk:' + req.query.workerId
        if (!req.session.user)
            req.session.user = _.randomString(1, /[A-Z]/) + _.randomString(9, /[a-z]/)
        req.user = req.session.user
        next()
    })

    var g_rpc_version = 1

    app.use('/static', express.static('./static'))
    app.get('/', function (req, res) {
        res.cookie('rpc_version', g_rpc_version, { httpOnly: false})
        res.cookie('rpc_token', _.randomString(10), { httpOnly: false})
        res.sendfile('./index.html')
    })

    var rpc = {}
    app.all(/\/rpc(\/([^\/]+)\/([^\/]+))?/, function (req, res, next) {
        _.run(function () {
            try {
                if (req.params[0]) {
                    if (g_rpc_version != req.params[1])
                        throw new Error('version mismatch')
                    if (!req.cookies.rpc_token || req.cookies.rpc_token != req.params[2])
                        throw new Error('token mismatch')
                    var runFunc = function (input) {
                        return rpc[input.func](input.arg, req, res)
                    }
                } else {
                    var runFunc = function (input) {
                        return rpc[input.func](input.arg)
                    }
                }
                var input = _.unJson(req.method.match(/post/i) ? req.body : _.unescapeUrl(req.url.match(/\?(.*)/)[1]))
                if (input instanceof Array)
                    var output = _.map(input, runFunc)
                else
                    var output = runFunc(input)
                var body = _.json(output) || "null"
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': Buffer.byteLength(body)
                })
                res.end(body)
            } catch (e) {
                next(e)
            }
        })
    })

    rpc.grabTasks = function (arg, req) {
        return _.p(db.collection('tasks').find({
           _id : { $gt : _.md5(_.randomString(10)) }
        }).limit(arg.n, _.p()))
    }

    rpc.submitResults = function (arg, req) {
        return dbEval(db, function (user, answers) {
            for (var i = 0; i < answers.length; i++) {
                var a = answers[i]
                db.answers.insert({
                    user : user,
                    task : a.task,
                    answer : a.answer
                })
            }
        }, req.user, arg)
    }

    rpc.addTasks = function (arg) {
        if (!(arg instanceof Array)) arg = [arg]
        _.each(arg, function (task) {
            task._id = _.md5(task.img.small + ':' + task.img.large)
        })
        _.p(db.collection('tasks').insert(arg, _.p()))
    }

    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }))

    app.listen(process.env.PORT, function() {
        console.log("go to " + process.env.HOST)
    })

})
