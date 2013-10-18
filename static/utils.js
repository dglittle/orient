
var tau = Math.PI * 2

///

function onError(msg) {
    alert((msg || 'Oops. Not sure what happened.') + '\n\n' +
        'Please try refreshing the page.')
}

g_rpc_version = $.cookie('rpc_version')
g_rpc_token = $.cookie('rpc_token')
g_rpc_timer = null
g_rpc = []

function rpc(func, arg, cb) {
    if (typeof(arg) == 'function') return rpc(func, null, arg)
    g_rpc.push({
        payload : { func : func, arg : arg },
        cb : cb
    })
    if (g_rpc_timer) clearTimeout(g_rpc_timer)
    g_rpc_timer = setTimeout(function () {
        g_rpc_timer = null
        var save_rpc = g_rpc
        g_rpc = []
        $.ajax({
            url : '/rpc/' + g_rpc_version + '/' + g_rpc_token,
            type : 'post',
            data : _.json(_.map(save_rpc, function (e) { return e.payload })),
            success : function (r) {
                _.each(r, function (r, i) {
                    if (save_rpc[i].cb)
                        save_rpc[i].cb(r)
                })
            },
            error : function (s) {
                onError(s.responseText)
            }
        })
    }, 0)
}

///

function mturkSubmit() {
    var params = _.getUrlParams()
    var f = $('<form action="' + params.turkSubmitTo + '/mturk/externalSubmit" method="GET"><input type="hidden" name="assignmentId" value="' + params.assignmentId + '"></input><input type="hidden" name="unused" value="unused"></input></form>')
    $('body').append(f)
    f.submit()
}

function mturkCheckPreview() {
    var params = _.getUrlParams()
    if (params.assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        var win = $(window)
        var w = win.width()
        var h = win.height()
        $('body').append($('<div style="position:fixed;left:0px;top:0px; z-index:10000;background:black;opacity:0.5;color:white;font-size:xx-large;padding:10px"/>').width(w).height(h).text('preview').click(function () {
            alert('This is a preview. Please accept the HIT to work on it.')
        }))
        return true
    }
}

function isHIT() {
    var params = _.getUrlParams()
    return !!params.assignmentId
}

///

function center(me) {
    var t = $('<table><tr><td valign="center" align="center"></td></tr></table>')
    t.find('td').append(me)
    return t
}

$.fn.myAppend = function (args) {
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i]
        if (a instanceof Array)
            $.fn.myAppend.apply(this, a)
        else
            this.append(a)
    }
    return this
}

function cssMap(s) {
    var m = {}
    _.each(s.split(';'), function (s) {
        var a = s.split(':')
        if (a[0])
            m[_.trim(a[0])] = _.trim(a[1])
    })
    return m
}

$.fn.myCss = function (s) {
    return this.css(cssMap(s))
}

$.fn.myHover = function (s, that) {
    var that = that || this
    var m = cssMap(s)
    var old = _.map(m, function (v, k) {
        return that.css(k)
    })
    this.hover(function () {
        that.css(m)
    }, function () {
        that.css(old)
    })
    return this
}

$.fn.addLabel = function (d) {
    if (typeof(d) == "string") d = $('<span/>').text(d)
        
    var id = randomIdentifier(10)
    this.attr('id', id)
    this.after($('<label for="' + id + '"/>').append(d))
    return this
}

function rotate(me, amount) {
    var s = 'rotate(' + amount + 'deg)'
    me.css({
        '-ms-transform' : s,
        '-moz-transform' : s,
        '-webkit-transform' : s,
        '-o-transform' : s
    })
    return me
}

$.fn.rotate = function (amount) {
    return rotate(this, amount)
}

///

function createThrobber() {
    var d = $('<div style="font-size:xx-large"/>').text('\u25DC')
    var start = _.time()
    var i = setInterval(function () {
        if ($.contains(document.documentElement, d[0])) {
            d.rotate(Math.round((_.time() - start) / 1000 * 360 * 2 % 360))
        } else
            clearInterval(i)
    }, 30)
    return d;
}

///

function getMousePos(e) {
    if (!e) e = window.event
    if (e.pageX || e.pageY)
        return {
            x : e.pageX,
            y : e.pageY
        }
    return {
        x : e.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft,
        y : e.clientY + document.body.scrollTop
            + document.documentElement.scrollTop
    }
}

///

function vector(x, y) {
    if (typeof(x) == 'object') {
        if (x instanceof Array) {
            return {
                x : x[0],
                y : x[1]
            }
        }
        return {
            x : x.x || x.left,
            y : x.y || x.top
        }
    }
    return {
        x : x,
        y : y
    }
}

function vectorAdd(a, b) {
    return {
        x : a.x + b.x,
        y : a.y + b.y
    }
}

function vectorSub(a, b) {
    return {
        x : a.x - b.x,
        y : a.y - b.y
    }
}

function vectorNeg(a) {
    return {
        x : -a.x,
        y : -a.y
    }
}

///

function myMod(a, b) {
    var x = a % b
    if (x < 0) return x + b
    return x
}

function lerpCap(t0, v0, t1, v1, t) {
    if (t < t0) t = t0
    if (t > t1) t = t1
    return _.lerp(t0, v0, t1, v1, t)
}

function serp(t0, v0, t1, v1, t) {
    return _.lerp(-1, v0, 1, v1, Math.sin(_.lerp(t0, -tau / 4, t1, tau / 4, t)))
}

function serpCap(t0, v0, t1, v1, t) {
    if (t < t0) t = t0
    if (t > t1) t = t1
    return serp(t0, v0, t1, v1, t)
}
