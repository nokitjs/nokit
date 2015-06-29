/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2015 PushOk Software
 * Licensed under MIT
 */
!(function () {
	"use strict";

	var UNDEFINED	= "undefined",
		OBJECT		= "object",
		FUNCTION	= "function",
		STRING		= "string",
		NUMBER		= "number",
		undefined,
		safe = {},
		root = this,
		_Array = Array,
		_Object = Object,
		_Function = Function,
		_previous = root ? root.safe : undefined,
		_options = {
			_debugger: false
		};

	safe.noConflict = function () {
		root.safe = _previous;
		return this;
	};

	/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
	var _isFunction = function (fn) {
		return fn instanceof _Function || _Object.prototype.toString.call(fn) === '[object Function]';
	}

	var _isUndefined = function (val) {
		return typeof val === UNDEFINED;
	}

	var _isObject = function (obj) {
		return _Object.prototype.toString.call(obj) === '[object Object]';
	}

	var _isArray = function (arr) {
		return arr instanceof _Array || _Object.prototype.toString.call(arr) === '[object Array]';
	}

	var _isIterable = function (obj) {
		return _isArray(obj) || _isObject(obj);
	}

	var _parseInt = function (num) {
		return (typeof num === NUMBER) ? Math.floor(num) : parseInt(num, 10);
	}

	var _arEach = /*_Array.prototype.forEach ? _Function.prototype.call.bind(_Array.prototype.forEach) :*/ function (arr, iterator) {
		var i = -1,
			len = arr.length;

		while (++i < len) {
			if (iterator(arr[i], i, arr) === false) {
				break;
			}
		}
	}

	var _armap = function (arr, iterator) {
		var len = arr.length,
			res = _Array(len),
			i = -1;

		if (_isFunction(iterator)) {
			while (++i < len) {
				res[i] = iterator(arr[i], i, arr);
			}
		} else {
			while (++i < len) {
				res[i] = arr[i] ? arr[i][iterator] : undefined;
			}
		}

		return res;
	}

	var _size = (function (oKeys) {
		if (oKeys)
			return function (obj) {
				return _isArray(obj) ? obj.length : oKeys(obj).length;
			}

		return function (obj) {
			if (_isArray(obj))
				return obj.length;

			var j = 0;
			for (var i in obj) {
				if (_Object.prototype.hasOwnProperty.call(obj, i)) {
					++j;
				}
			}
			return j;
		}
	})(_Object.keys);

	var _keys = _Object.keys || function (obj) {
		if (typeof obj !== OBJECT && (typeof obj !== FUNCTION || obj === null)) {
			throw new TypeError('Object.keys called on non-object');
		}

		var len = _size(obj),
			arr = _Array(len),
			i = -1;

		if (_isArray(obj)) {
			while (++i < len) {
				arr[i] = i;
			}
		} else {
			for (var j in obj) {
				if (_Object.prototype.hasOwnProperty.call(obj, j)) {
					arr[++i] = j;
				}
			}
		}

		return arr;
	}

	var _toArray = function (obj) {
		if (_isArray(obj))
			return obj;

		var keys = _keys(obj),
			len = keys.length,
			arr = _Array(len),
			i = -1;

		while (++i < len) {
			arr[i] = obj[keys[i]];
		}

		return arr;
	}

	var _isNaN = function (nan) {
		return nan !== nan;
	}

	var _later;

	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED) {
			if (typeof Promise === FUNCTION) { // new browsers polyfill
				_later = (function (Promise) {
					var promise = new Promise(function(resolve, reject){ resolve(); });

					return function (callback) {
						promise.then(function () { callback(); });
					}
				})(Promise);
			} else if (typeof Image === FUNCTION) { // old browsers polyfill
				_later = (function (Image) {
					return function (callback) {
						var img = new Image;
						img.onerror = function () { callback(); };
						img.src = 'data:image/png,0'
					};
				})(Image);
			} else
				_later = function (callback) { setTimeout(callback, 0); };
		} else
			_later = process.nextTick;
	} else {
		_later = function (callback) { setImmediate(callback); };
	}

	var _back = function (callback) {
		var that = this,
			args = _argToArr.apply(1, arguments);

		_later(function () {
			callback.apply(that, args);
		});
	}

	var _noop = function () {};

	var _error = function (text, callback) {
		if (!_isFunction(callback))
			throw new Error(text);

		callback(new Error(text));
	};

	var _argToArr = function() {
		var len = arguments.length,
			rest = _parseInt(this);

		if (_isNaN(rest))
			throw new Error('Pass arguments to "safe.args" only through ".apply" method!');

		if (len === 0 || rest > len)
			return [];

		var args = _Array(len - rest),
			i = rest - 1;

		while (++i < len) {
			args[i - rest] = i < 0 ? null : arguments[i];
		}

		return args;
	}

	var _once = function (callback) {
		return function (err) {
			var _cb;

			if (callback) {
				_cb = callback;
				callback = err ? UNDEFINED : null;
				_cb.apply(this, arguments);
			} else {
				if (callback === null)
					throw new Error("Callback was already called.");
			}
		};
	};

	var _catcher = function (fn, self, args, callback) {
		try {
			if (arguments.length === 3) {
				callback = args;
				return fn.call(self, callback);
			}

			return fn.apply(self, args);
		} catch (err) {
			if (_options._debugger)
				_options._debugger(err, _argToArr.apply(0, arguments));

			callback(err);
		}
	}

	var _run = function (fn, callback) {
		callback = _once(callback);
		_catcher(fn, this, callback);
	}

	var _result = function (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			var err, result = _catcher(fn, this, _argToArr.apply(0, arguments), function (er) {
				err = er;
			});

			if (err)
				callback(err);
			else if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		}
	}

	var _sure_result = function (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			throw new Error("Exactly two arguments are required");

		return function (err) {
			if (err)
				return callback.apply(this, arguments);

			var err, result = _catcher(fn, this, _argToArr.apply(1, arguments), function (er) {
				err = er;
			});

			if (err)
				callback(err);
			else if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		}
	}

	var _sure = function (callback, fn) {
		if (_isUndefined(fn) || !_isFunction(callback))
			throw new Error("Exactly two arguments are required")

		return function (err) {
			if (err)
				return callback.apply(this, arguments);

			if (!_isFunction(fn))
				return _back(callback, null, fn);

			_catcher(fn, this, _argToArr.apply(1, arguments), callback);
		}
	}

	var _trap = function (callback, fn) {
		if (_isUndefined(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}

			_catcher(fn, this, _argToArr.apply(0, arguments), callback);
		}
	}

	var _wrap = function (fn, callback) {
		if (_isUndefined(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			var args = _argToArr.apply(0, arguments);

			args.push(callback);

			_catcher(fn, this, args, callback);
		}
	}

	var _sure_spread = function (callback, fn) {
		return function (err) {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}

			if (err)
				return callback.apply(this, arguments);

			_catcher(fn, this, arguments[1], callback);
		}
	}

	var _spread = function (fn) {
		return function (arr) {
			fn.apply(this, arr)
		}
	}

	var _inherits = (function () {
		function noop() {}

		function ecma3(ctor, superCtor) {
			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
			noop.prototype = null;
		}

		function ecma5(ctor, superCtor) {
			ctor.prototype = _Object.create(superCtor.prototype, {
				constructor: {
					value: ctor,
					enumerable: false
				}
			});
		}

		return _Object.create ? ecma5 : ecma3;
	})();

	var _async = function (self, fn) {
		var args = _argToArr.apply(2, arguments);

		return function (callback) {
			args.push(callback);
			_catcher(self[fn], self, args, callback);
		}
	}

	var _controlFlow = function (flow, arr, callback) {
		callback = _once(callback || _noop);

		var results = _isArray(arr) ? _Array(arr.length) : {};

		flow(_keys(arr), function (key, cb) {
			arr[key](function (err) {
				if (!err) {
					if (arguments.length === 0) {
						results[key] = null;
					} else {
						results[key] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					}
				}

				cb(err);
			});
		}, function (err) {
			if (err)
				callback(err);
			else
				callback(null, results);
		});
	}

	var _executeSeries = function (chain, callback) {
		if (!_isIterable(chain)) {
			return _error("Array or Object are required", callback);
		}

		callback = _once(callback || _noop);

		chain = _toArray(chain);

		var iter = 0,
			len = chain.length - 1;

		(function iterator(err) {
			if (err)
				return callback(err);

			var args = _argToArr.apply(1, arguments);

			_run(function (cb) {
				args.push(cb);
				chain[iter++].apply(this, args);
			}, iter === len ? callback : iterator);
		})();
	}

	var _reduce = function (arr, memo, fn, callback, direction) {
		if (!_isArray(arr)) {
			return _error("Array are required", callback);
		}

		callback = _once(callback || _noop);

		var iter = 0,
			len = arr.length;

		(function iterator(err, memo) {
			if (err)
				return callback(err);

			if (len === iter)
				return callback(null, memo);

			_run(function (cb) {
				if (direction)
					fn(memo, (arr[iter++]), cb);
				else
					fn(memo, (arr[len - (++iter)]), cb);
			}, iterator);
		})(null, memo);
	}

	var _eachLimit = function (limit) {
		limit = _parseInt(limit) || Infinity;

		return function (arr, fn, callback) {
			if (!_isArray(arr)) {
				return _error("Array are required", callback);
			}

			callback = _once(callback || _noop);

			var qnt = arr.length,
				running = 0,
				i = 0,
				stop,
				l = qnt;

			(function iterator (_err) {
				if (stop)
					return;

				stop = (_err || qnt === 0);

				if (stop) {
					return callback(_err || null);
				}

				while ((running < limit && i < l) && !stop) {
					++running;
					++i;

					_run(function (cb) {
						fn(arr[i-1], cb);
					}, function (err) {
						--qnt;
						--running;

						if (!stop)
							iterator(err);
					});
				}
			})();
		}
	}

	var _eachSeries = _eachLimit(1);

	var _eachOf = function (flow, obj, fn, callback) {
		if (!_isIterable(obj)) {
			return _error("Array or Object are required", callback);
		}

		flow(_toArray(obj), fn, callback);
	}

	var _map = function (flow, obj, fn, callback) {
		if (!_isIterable(obj)) {
			return _error("Array or Object are required", callback);
		}

		callback = _once(callback || _noop);

		var arr = _keys(obj),
			result = _Array(arr.length),
			idx = 0;

		flow(arr, function (key, cb) {
			var i = idx++;

			fn(obj[key], function (err, res) {
				result[i] = res;
				cb(err);
			});
		}, function (err) {
			if (err)
				callback(err);
			else
				callback(null, result);
		});
	}

	var _times = function (flow, times, fn, callback) {
		times = _parseInt(times);

		var arr = _Array(times),
			i = -1;

		while (++i < times) {
			arr[i] = i;
		}

		_map(flow, arr, fn, callback);
	}

	var _filter = function (flow, trust, arr, fn, callback) {
		if (!_isArray(arr)) {
			return _error("Array are required", callback);
		}

		callback = _once(callback || _noop);

		var result = [],
			idx = 0;

		flow(arr, function (elem, cb) {
			var i = idx++;

			fn(elem, function (err, is) {
				if ((trust && is) || !(trust || is)) {
					result.push({e: elem, i: i});
				}
				cb(err);
			});
		}, function (err) {
			if (err)
				callback(err);
			else
				callback(null, _armap(result.sort(function (a, b) { return a.i - b.i; }), "e"));
		});
	}

	var _chains = function (fn) {
		var chain = [],
			self = this;

		if (_isFunction(fn))
			chain.push(fn);

		self.then = function (fn) {
			chain.push(fn);
			return self;
		}

		self.done = function (callback) {
			_executeSeries(chain, callback);
		}

		return self;
	}

	var _auto = function (obj, callback) {
		var results = {},
			stop,
			starter = {},
			unresolve = null,
			tasks = _keys(obj).sort(function (a, b) {
				return (_isArray(obj[a]) ? obj[a].length : 0) - (_isArray(obj[b]) ? obj[b].length : 0);
			}),
			qnt = tasks.length;

		// check dependencies
		_arEach(tasks, function (key) {
			if (_isArray(obj[key])){
				var i = -1,
					targer = obj[key],
					deps,
					len = targer.length - 1;

				while (++i < len) {
					deps = obj[targer[i]];

					if (!deps) {
						unresolve = "Unresolve dependencies";
						return false;
					} else if ((deps == key) || (_isArray(deps) && deps.indexOf(key) !== -1)) {
						unresolve = "Cyclic dependencies";
						return false;
					}
				}
			}
		});

		if (unresolve)
			return _error(unresolve, callback);

		callback = _once(callback || _noop);

		(function iterator () {
			_arEach(tasks, function (k) {
				if (stop)
					return false;

				if (starter[k])
					return;

				var task, target = obj[k];

				if (_isArray(target)) {
					var i = -1,
						fin = target.length - 1,
						req;

					while (++i < fin) {
						if (!results.hasOwnProperty(target[i]))
							return;
					}

					task = target[fin];
				} else
					task = target;

				starter[k] = 1;

				_run(function (cb) {
					task(cb, results);
				}, function (err) {
					--qnt;

					if (stop)
						return;

					stop = (err || qnt === 0);

					if (err)
						return callback(err, results);

					if (arguments.length > 1)
						results[k] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					else
						results[k] = null;

					if (stop)
						return callback(err, results);

					iterator();
				});
			});
		})();
	}

	var _swhile = function (test, fn, callback, dir) {
		(function iterator() {
			_run(fn, _sure(callback, function () {
				if (dir != test())
					callback(null);
				else
					_later(iterator);
			}));
		})();
	}

	var _apply = function (fn) {
		var args = _argToArr.apply(1, arguments);

		return function () {
			args = args.concat(_argToArr.apply(0, arguments));
			fn.apply(this, args);
		};
	}

	var _retry = function (times, fn, callback) {
		var error, done;

		if (_isFunction(times)) {
			callback = fn;
			fn = times;
			times = 5;
		} else
			times = _parseInt(times) || 5;

		function task(wcb, results) {
			_eachSeries(_Array(times), function (item, cb) {
				fn(function (err, res) {
					error = err;
					done = res;
					cb(!err);
				}, results);
			}, function () {
				(wcb || callback || _noop)(error || null, done);
			});
		}

		return callback ? task() : task;
	}

	var _queue = function (worker, concurrency) {
		var self = this;

		if (_Object.defineProperties) {
			_Object.defineProperties(self, {
				'__worker': {
					enumerable: false,
					configurable: false,
					writable: false,
					value: worker
				},
				'__workers': {
					enumerable: false,
					configurable: false,
					writable: true,
					value: 0
				},
				'tasks': {
					enumerable: false,
					configurable: false,
					writable: true,
					value: []
				}
			});
		} else {
			self.__worker = worker;
			self.__workers = 0;
			self.tasks = [];
		}

		self.started = false;
		self.paused = false;
		self.concurrency = _parseInt(concurrency) || 1;
	}

	_queue.prototype.saturated = _noop;
	_queue.prototype.empty = _noop;
	_queue.prototype.drain = _noop;

	_queue.prototype.kill = function () {
		this.drain = _noop;
		this.tasks = [];
	}

	_queue.prototype.length = function () {
		return this.tasks.length;
	}

	_queue.prototype.running = function () {
		return this.__workers;
	}

	_queue.prototype.idle = function () {
		return this.tasks.length + this.__workers === 0;
	}

	_queue.prototype.pause = function () {
		this.paused = true;
	}

	_queue.prototype.resume = function () {
		var self = this;
		if (self.paused === false)
			return;

		self.paused = false;

		var w = 0;

		while (++w <= self.tasks.length && w <= self.concurrency) {
			self.__execute();
		}
	}

	_queue.prototype.__execute = function () {
		var self = this;

		if (!self.paused && self.__workers < self.concurrency && self.tasks.length !== 0) {
			var task = self.tasks.shift();
			if (self.tasks.length === 0)
				self.empty();

			++self.__workers;

			if (self.__workers === self.concurrency)
				self.saturated();

			var cb = _once(function () {
				--self.__workers;
				task.callback.apply(task, arguments);

				if (self.tasks.length + self.__workers === 0)
					self.drain();

				self.__execute();
			});

			_run(function (cb) {
				self.__worker.call(task, task.data, cb);
			}, cb);
		}
	}

	_queue.prototype.__insert = function (data, pos, callback) {
		var self = this;

		self.started = true;

		if (!_isArray(data))
			data = [data];

		if (data.length === 0)
			return self.drain();

		var arlen = data.length,
			tlen = self.tasks.length,
			i = -1,
			arr = _armap(data, function (task, i) {
				return {
					data: task,
					priority: pos,
					callback: _once(_isFunction(callback) ? callback : _noop)
				};
			});

		if (tlen) {
			if (self instanceof _priorQ) {
				var firstidx = tlen ? self.tasks[0].priority : 0,
					lastidx = tlen ? self.tasks[tlen - 1].priority : 0;

				if (pos > firstidx)
					self.tasks = arr.concat(self.tasks);
				else
					self.tasks = self.tasks.concat(arr);

				if (firstidx >= pos && pos < lastidx) {
					self.tasks.sort(function (b, a) { // reverse sort
						return a.priority - b.priority;
					});
				}
			} else {
				if (pos)
					self.tasks = arr.concat(self.tasks);
				else
					self.tasks = self.tasks.concat(arr);
			}
		} else
			self.tasks = arr;

		while (++i < arlen && !self.paused) {
			self.__execute();
		}
	}

	var _priorQ = function (worker, concurrency) {
		_queue.call(this, worker, concurrency);
	};

	var _seriesQ = function (worker, concurrency) {
		_queue.call(this, worker, concurrency);
	};

	_inherits(_priorQ, _queue);
	_inherits(_seriesQ, _queue);

	_priorQ.prototype.push = function (data, prior, callback) {
		this.__insert(data, prior, callback);
	}

	_seriesQ.prototype.push = function (data, callback) {
		this.__insert(data, false, callback);
	}

	_seriesQ.prototype.unshift = function (data, callback) {
		this.__insert(data, true, callback);
	}

	/* ++++++++++++++++++++++++++ public methods +++++++++++++++++++++++++++ */
	safe.noop = _noop;
	safe.yield = _later;
	safe.back = safe.setImmediate = safe.nextTick = _back; // compatible with async
	safe.apply = _apply;
	safe.async = _async;
	safe.inherits = _inherits;
	safe.args = _argToArr;

	safe.setDebugger = function (fn) {
		_options._debugger = _isFunction(fn) ? fn : false;
	}

	safe.result = function (callback, fn) {
		return _result(callback, fn);
	}

	safe.sure_result = safe.trap_sure_result = function (callback, fn) {
		return _sure_result(callback, fn);
	}

	safe.sure = safe.trap_sure = function (callback, fn) {
		return _sure(callback, fn);
	}

	safe.trap = function (callback, fn) {
		return _trap(callback, fn);
	}

	safe.wrap = function (fn, callback) {
		return _wrap(fn, callback);
	}

	safe.run = function (fn, callback) {
		_run(fn, callback);
	}

	safe.sure_spread = function (callback, fn) {
		return _sure_spread(callback, fn);
	}

	safe.spread = function (fn) {
		return _spread(fn);
	}

	safe.chain = function (fn) {
		return new _chains(fn);
	}

	safe.each = safe.forEach = function (arr, fn, callback) {
		_eachLimit(arr.length)(arr, fn, callback);
	}

	safe.eachLimit = safe.forEachLimit = function (arr, limit, fn, callback) {
		_eachLimit(limit)(arr, fn, callback);
	}

	safe.eachSeries = safe.forEachSeries = function (arr, fn, callback) {
		_eachSeries(arr, fn, callback);
	}

	safe.forEachOf = function (obj, fn, callback) {
		_eachOf(_eachLimit(_size(obj)), obj, fn, callback);
	}

	safe.forEachOfLimit = function (obj, limit, fn, callback) {
		_eachOf(_eachLimit(limit), obj, fn, callback);
	}

	safe.forEachOfSeries = function (obj, fn, callback) {
		_eachOf(_eachSeries, obj, fn, callback);
	}

	safe.map = function (obj, fn, callback) {
		_map(_eachLimit(_size(obj)), obj, fn, callback);
	}

	safe.mapLimit = function (obj, limit, fn, callback) {
		_map(_eachLimit(limit), obj, fn, callback);
	}

	safe.mapSeries = function (obj, fn, callback) {
		_map(_eachSeries, obj, fn, callback);
	}

	safe.filter = function (obj, fn, callback) {
		_filter(_eachLimit(_size(obj)), 1, obj, fn, callback);
	}

	safe.filterSeries = function (obj, fn, callback) {
		_filter(_eachSeries, 1, obj, fn, callback);
	}

	safe.reject = function (obj, fn, callback) {
		_filter(_eachLimit(_size(obj)), 0, obj, fn, callback);
	}

	safe.rejectSeries = function (obj, fn, callback) {
		_filter(_eachSeries, 0, obj, fn, callback);
	}

	safe.waterfall = function (obj, callback) {
		_executeSeries(obj, callback);
	}

	safe.series = function (obj, callback) {
		_controlFlow(_eachSeries, obj, callback);
	}

	safe.parallel = function (obj, callback) {
		_controlFlow(_eachLimit(_size(obj)), obj, callback);
	}

	safe.auto = function (obj, callback) {
		_auto(obj, callback);
	}

	safe.whilst = function (test, fn, callback) {
		_swhile(test, fn, callback, true);
	}

	safe.doWhilst = function (fn, test, callback) {
		_run(fn, function (err) {
			if (err)
				return callback(err);

			_swhile(test, fn, callback, true);
		});
	}

	safe.until = function (test, fn, callback) {
		_swhile(test, fn, callback, false);
	}

	safe.doUntil = function (fn, test, callback) {
		_run(fn, function (err) {
			if (err)
				return callback(err);

			_swhile(test, fn, callback, false);
		});
	}

	safe.reduce = function (arr, memo, fn, callback) {
		_reduce(arr, memo, fn, callback, 1);
	}

	safe.reduceRight = function (arr, memo, fn, callback) {
		_reduce(arr, memo, fn, callback, 0);
	}

	safe.queue = function (worker, threads) {
		return new _seriesQ(worker, threads);
	}

	safe.priorityQueue = function (worker, threads) {
		return new _priorQ(worker, threads);
	}

	safe.retry = function (times, fn, callback) {
		return _retry(times, fn, callback);
	}

	safe.times = function (times, fn, callback) {
		_times(_eachLimit(times), times, fn, callback);
	}

	safe.timesSeries = function (times, fn, callback) {
		_times(_eachSeries, times, fn, callback);
	}

	if (typeof module === OBJECT && typeof module.exports === OBJECT) {
	// commonjs module
		module.exports = safe;
	} else if (typeof define === FUNCTION && define.amd) {
	// AMD module
		define([], function () {
			return safe;
		})
	} else {
	// finally old school
		this.safe = safe;
	}
}.call(this));
