var assert = require('assert');
var safe = require('../lib/safe.js');

var randomTime = function() {
	 return 4 + Math.round(2 * Math.random());
}

describe("safe",function () {
	describe("sure", function () {
		it("should rise up exceptions", function () {
			safe.sure(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should return value on success instead of function execute", function () {
			safe.sure(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, "value"
			)(null);
		})
		it("should not return value if error happens", function () {
			safe.sure(function (err,v) {
				assert(err!=null)
				}, "value"
			)(new Error());
		})
	})
	describe("trap", function () {
		it("should rise up exceptions to explicetly provided callback", function () {
			safe.trap(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should rise up exceptions to indirectly provided callback", function () {
			safe.trap(function () {
				throw new Error();
			})(null,function (err) {
				assert(err!=null)
			});
		})
	})
	describe("result", function () {
		it("should rise up exceptions", function () {
			safe.result(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should convert return to callback", function () {
			safe.result(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, function () {
					return "value"
			})(null);
		})
	})
	describe("sure_result", function () {
		it("should rise up exceptions", function () {
			safe.sure_result(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure_result(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should convert return to callback", function () {
			safe.sure_result(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, function () {
					return "value"
			})(null);
		})
	})
	describe("wrap", function () {
		it("should rise up exceptions", function () {
			safe.wrap(function () {
				throw new Error();
			},function (err) {
				assert(err!=null)
			})(null);
		})
		it("should append callback to inner function", function () {
			safe.wrap(function (cb) {
				cb(new Error())
			},function (err) {
				assert(err!=null)
			})(null);
		})
	})
	describe("run", function () {
		it("should rise up exceptions", function () {
			safe.run(function () {
				throw new Error();
			},function (err) {
				assert(err!=null)
			});
		})
	})
	describe("spread", function () {
		it("should convert array to variadic arguments", function () {
			safe.spread(function (a1,a2,a3) {
				assert.equal(a1,"apple");
				assert.equal(a2,"samsung");
				assert.equal(a3,"nokia");
			})(["apple","samsung","nokia"])
		})
	})
	describe("sure_spread", function () {
		it("should rise up exceptions", function () {
			safe.sure_spread(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure_spread(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should convert array to variadic arguments", function () {
			safe.sure_spread(safe.noop,function (a1,a2,a3) {
				assert.equal(a1,"apple");
				assert.equal(a2,"samsung");
				assert.equal(a3,"nokia");
			})(null,["apple","samsung","nokia"])
		})
	})
	describe("async", function () {
		var obj = {
			doStuff:function (a,b,cb) {
				cb(null, a+b);
			},
			doBad:function (a,b,cb) {
				throw new Error();
			}
		}
		it("should rise up exceptions", function () {
			safe.async(obj,"doBad")(function (err,v) {
				assert(err != null);
			});
		})
		it("should bind to object function and rise up callback value", function () {
			safe.async(obj,"doStuff",2,3)(function (err,v) {
				assert(err==null);
				assert.equal(v, 5);
			});
		})
	})
	describe("back", function () {
		it("should return value in next iteration", function (done) {
			var a = 0;
			safe.back(function (err) { done((err!=null && a==1)?null:new Error("Wrong behavior")) }, new Error());
			a += 1;
		})
	})
	describe("yield", function () {
		it("should execute function in next iteration", function (done) {
			var a = 0;
			safe.yield(function () { done(a==1?null:new Error("Wrong behavior")) });
			a += 1;
		})
	})
	describe("inherits", function () {
		var parent = function () {
		}
		parent.prototype.parent_function = function () {
		}
		var child = function () {
		}
		safe.inherits(child,parent)
		child.prototype.child_function = function () {
		}
		it("should make magic that gives child instance methods of parents", function () {
			var obj = new child();
			obj.child_function();
			obj.parent_function();
		})
	})
	describe("chain", function () {
		it("should execute step by step asynchronous functions in chain", function (done) {
			var a = 0;
			safe.chain(function (cb) {
					safe.yield(function () {
						cb(null, 'test');
					});
					a += 1;
				})
				.then(function (test, cb) {
					if (test !== 'test')
						return cb(new Error("Wrong behavior"));

					safe.yield(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), a);
					});
					a += 1;
				})
				.then(function (a, cb) {
					safe.yield(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"))
					});
					a += 1;
				})
				.done(done);
		})
	})
	describe("for each", function () {
		it("should execute asynchronous each (array)", function (done) {
			var a = 1000;
			var arr = new Array(a);
			for (var i = 0; i < arr.length; i += 1)
				arr[i] = i;

			safe.each(arr, function (i, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				done(a === 0 ? null : new Error("Wrong behavior"));
			}));
		})

		it("should execute asynchronous each (object)", function (done) {
			var a = 1000;
			var obj = {};
			for (var i = 0; i < a; i += 1)
				obj[i] = i;

			safe.forEachOf(obj, function (i, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				done(a === 0 ? null : new Error("Wrong behavior"));
			}));
		})

		it("should execute asynchronous each series (array)", function (done) {
			var a = 0;
			safe.eachSeries([1,2,3,4,5], function (i, cb) {
				setTimeout(function () {
					cb(i === a ? null : new Error("Wrong behavior"));
				}, randomTime());

				a += 1;
			}, done);
		})

		it("should execute asynchronous each series (object)", function (done) {
			var a = 0;
			safe.forEachOfSeries({a: 1, b: 2, c: 3, d: 4, e: 5}, function (i, cb) {
				setTimeout(function () {
					cb(i === a ? null : new Error("Wrong behavior"));
				}, randomTime());

				a += 1;
			}, done);
		})

		it("Check error in each series", function (done) {
			var a = 0;
			safe.forEachOfSeries([1,2,3,4,5], function (i, cb) {
				++a;

				setTimeout(function () {
					cb(new Error("Exit"));
				}, randomTime());
			}, function (err) {
				done(a === 1 && err ? null : new Error("Wrong behavior"));
			});
		})
	})
	describe("control flow", function () {
		it("should execute step by step asynchronous functions in waterfall", function (done) {
			var a = 0;
			safe.waterfall([
				function (cb) {
					setTimeout(function () {
						cb(null, "test");
					}, randomTime());

					a += 1;
				},
				function (test, cb) {
					if (test !== 'test')
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), a);
					}, randomTime());

					a += 1;
				},
				function (a, cb) {
					setTimeout(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"), "final")
					}, randomTime());

					a += 1;
				}
			], safe.sure(done, function (result) {
				done(result !== "final" ? new Error("Wrong behavior") : null);
			}));
		})
		it("should execute step by step asynchronous functions in waterfall (catch errors)", function (done) {
			safe.waterfall([
				function (cb) {
					setTimeout(function () {
						cb(new Error(1));
					}, randomTime());
				},
				function (cb) {
					setTimeout(function () {
						cb(new Error(2));
					}, randomTime());
				},
				function (cb) {
					throw new Error(3);
				}
			], function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			})
		})
		it("should execute step by step asynchronous functions  in series", function (done) {
			var a = 0;
			safe.series([
				function (cb) {
					setTimeout(function () {
						cb(null, 'first');
					}, randomTime());

					a += 1;
				},
				function (cb) {
					setTimeout(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), "middle");
					}, randomTime());

					a += 1;
				},
				function (cb) {
					setTimeout(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"), "last");
					}, randomTime());

					a += 1;
				}
			], safe.sure(done, function (result) {
				done((result[0] !== "first" || result[1] !== "middle" || result[2] !== "last") ? new Error("Wrong behavior") : null);
			}));
		})
		it("should execute step by step asynchronous functions in series (catch errors)", function (done) {
			var already = 0;

			safe.series({
				"2": function (cb) {
					already = 1;

					setTimeout(function () {
						cb(new Error(3));
					}, randomTime());
				},
				"1": function (cb) {
					already = 1;

					setTimeout(function () {
						cb(new Error(2));
					}, randomTime());
				},
				"0": function (cb) {
					setTimeout(function () {
						cb(1);
					}, randomTime());
				}
			}, function (err, result) {
				if (already)
					throw new Error("Wrong behavior");

				already = 1;
				done(err === 1 ? null : new Error("Wrong behavior"));
			})
		})
		it("should execute asynchronous functions in parallel", function (done) {
			safe.parallel({
				"2": function (cb) {
					setTimeout(function () {
						cb(null, "last");
					}, randomTime());
				},
				"1": function (cb) {
					setTimeout(function () {
						cb(null, "middle");
					}, randomTime());
				},
				"0": function (cb) {
					setTimeout(function () {
						cb(null, 'first');
					}, randomTime());
				}
			}, safe.sure(done, function (result) {
				done((result["0"] !== "first" || result["1"] !== "middle" || result["2"] !== "last") ? new Error("Wrong behavior") : null);
			}));
		})
		it("should execute asynchronous functions in parallel (catch errors)", function (done) {
			safe.parallel({
				"2": function (cb) {
					setTimeout(function () {
						cb(new Error(1));
					}, randomTime());
				},
				"1": function (cb) {
					setTimeout(function () {
						cb(new Error(2));
					}, randomTime());
				},
				"0": function (cb) {
					throw new Error(3);
				}
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			})
		})
		it("should automatically resolve dependencies execute asynchronous functions", function (done) {
			safe.auto({
				"4": ["0", "2", function (cb, result) {
					if (result["0"] !== "Tinker" || result["2"] !== "Soldier")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Spy");
					}, randomTime());
				}],
				"3": ["1", "2", "4", function (cb, result) {
					if (result["1"] !== "Tailor" || result["2"] !== "Soldier" || result["4"] !== "Spy")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Done");
					}, randomTime());
				}],
				"2": ["0", function (cb, result) {
					if (result["0"] !== "Tinker")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Soldier");
					}, randomTime());
				}],
				"1": ["0", "4", function (cb, result) {
					if (result["0"] !== "Tinker" || result["4"] !== "Spy")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Tailor");
					}, randomTime());
				}],
				"0": function (cb) {
					setTimeout(function () {
						cb(null, "Tinker");
					}, randomTime());
				}
			}, function (err, result) {
				if (result["0"] !== "Tinker" 	||
					result["1"] !== "Tailor" 	||
					result["2"] !== "Soldier" 	||
					result["3"] !== "Done"		||
					result["4"] !== "Spy")
						return done(new Error("Wrong behavior"));

				done();
			});
		})
		it("Test unresolve dependies in auto", function (done) {
			safe.auto({
				"2": function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				},
				"1": function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				},
				"0": ["3", function (cb) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}]
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		})
		it("Test cyclic dependies in auto", function (done) {
			safe.auto({
				"2": ["1", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"1": ["0", "2", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"0": function (cb) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		})
		it("Test errors in auto", function (done) {
			safe.auto({
				"2": ["1", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"1": ["0", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"0": function (cb) {
					throw new Error('exit');
				}
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		})
		it("queue", function (done) {
			var queue = safe.queue(function(task, cb){
				task.cmd(function (err, res) {
					cb((err || res != "test") ? (err || new Error("Wrong behavior")) : null);
				});
			}, 1);

			var counter = 0;

			queue.drain = function () {
				if (counter !== 1000)
					return done(new Error("Wrong behavior"));
				done();
			}

			var arr = [];

			for (var i = 0; i < 1000; i++) {
				arr.push({
					cmd: function(cb){
						safe.yield(function () {
							counter++;
							cb(null, "test");
						});
					}
				});

				if (arr.length === 10) {
					queue.push(arr, function (err) { if (err) throw err; });
					arr = [];
				}
			}

			if (queue.length() !== 999)
				throw new Error("Wrong behavior");
		})
		it("priorityQueue", function (done) {
			var queue = safe.priorityQueue(function(task, cb){
				task.cmd(function (err, res) {
					cb((err || res != "test") ? (err || new Error("Wrong behavior")) : null);
				});
			}, 2);

			queue.pause();

			var arr = [], sature = 0;

			queue.saturated = function () {
				if (sature)
					return;

				if (queue.length() !== 2)
					throw new Error("Wrong behavior");

				sature = 1;
			}

			queue.drain = function () {
				if (arr.join(",") !== "4,2,1,3" || !sature)
					return done(new Error("Wrong behavior"));
				done();
			}

			queue.push({
				cmd: function(cb){
					safe.yield(function () {
						arr.push(1);
						cb(null, "test");
					});
				}
			}, 2, function (err) { if (err) throw err; });

			queue.push({
				cmd: function(cb){
					safe.yield(function () {
						arr.push(2);
						cb(null, "test");
					});
				}
			}, 3, function (err) { if (err) throw err; });

			queue.push({
				cmd: function(cb){
					safe.yield(function () {
						arr.push(3);
						cb(null, "test");
					});
				}
			}, 1, function (err) { if (err) throw err; });

			queue.push({
				cmd: function(cb){
					safe.yield(function () {
						arr.push(4);
						cb(null, "test");
					});
				}
			}, 4, function (err) { if (err) throw err; });

			if (queue.length() != 4)
				return done(new Error("Wrong behavior"));

			queue.resume();
		})
	})
	describe("map", function () {
		it("should execute asynchronous map", function (done) {
			safe.map({a: 1, b: 2, c: 3, d: 4, e: 5}, function (i, cb) {
				setTimeout(function () {
					cb(null, i*2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done((res[0] === 2 && res[1] === 4 && res[2] === 6 && res[3] === 8 && res[4] === 10) ? null : new Error("Wrong behavior"));
			}));
		})

		it("should execute asynchronous map series", function (done) {
			var execute = 0;

			safe.mapSeries({a: 1, b: 2, c: 3, d: 4, e: 5}, function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i*2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done((res[0] === 2 && res[1] === 4 && res[2] === 6 && res[3] === 8 && res[4] === 10) ? null : new Error("Wrong behavior"));
			}));
		})
	})
	describe("times", function () {
		it("should execute asynchronous times", function (done) {
			safe.times(5, function (i, cb) {
				setTimeout(function () {
					cb(null, i += 1);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done(res.join(",") === "1,2,3,4,5" ? null : new Error("Wrong behavior"));
			}));
		})

		it("should execute asynchronous times series", function (done) {
			var execute = 0;

			safe.timesSeries(5, function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i*2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done(res.join(",") === "0,2,4,6,8" ? null : new Error("Wrong behavior"));
			}));
		})
	})
	describe("filter", function () {
		it("should execute asynchronous filter (array)", function (done) {
			safe.filter([1,2,3,4,5], function (i, cb) {
				setTimeout(function () {
					cb(null, i%2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done(res.join(",") === "1,3,5" ?  null : new Error("Wrong behavior"));
			}));
		})

		it("should execute asynchronous filter series (array)", function (done) {
			var execute = 0;

			safe.filterSeries([1,2,3,4,5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i%2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done(res.join(",") === "1,3,5" ?  null : new Error("Wrong behavior"));
			}));
		})
	})
	describe("reject", function () {
		it("should execute asynchronous reject (array)", function (done) {
			safe.reject([1,2,3,4,5], function (i, cb) {
				setTimeout(function () {
					cb(null, i%2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done(res.join(",") === "2,4" ?  null : new Error("Wrong behavior"));
			}));
		})

		it("should execute asynchronous reject series (array)", function (done) {
			var execute = 0;

			safe.rejectSeries([1,2,3,4,5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i%2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				done(res.join(",") === "2,4" ?  null : new Error("Wrong behavior"));
			}));
		})
	})
	describe("retry", function () {
		it("should few times retry to execute function", function (done) {
			var i = 0;

			safe.retry(function (cb) {
				setTimeout(function () {
					i += 1;

					if (i !== 5) {
						cb(new Error("need more retry"));
					} else
						cb(null, "done");

				}, randomTime());
			}, safe.sure(done, function (result) {
				done(result === "done" ? null : new Error("Wrong behavior"));
			}));
		})
	})
	describe("do-while", function () {
		it("should execute while a condition is true", function (done) {
			var a = 0;
			var flag = false;

			safe.whilst(
				function () {
					flag = false;
					return a < 5;
				},
				function (cb) {
					if (flag)
						cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				}, safe.sure(done, function () {
					done(a === 5 ? null : new Error("Wrong behavior"));
				}));
		})
		it("should execute while a condition is true (post check)", function (done) {
			var a = 0;
			var flag = true;

			safe.doWhilst(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				},
				function () {
					if (flag)
						throw new Error("Wrong behavior");

					return a < 5;
				}, safe.sure(done, function () {
					done(a === 5 ? null : new Error("Wrong behavior"));
				}));
		})
	})
	describe("do-until", function () {
		it("should execute until a condition is false", function (done) {
			var a = 0;
			var flag = false;

			safe.until(
				function () {
					flag = false;
					return a === 5;
				},
				function (cb) {
					if (flag)
						cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				}, safe.sure(done, function () {
					done(a === 5 ? null : new Error("Wrong behavior"));
				}));
		})
		it("should execute until a condition is false (post check)", function (done) {
			var a = 0;
			var flag = true;

			safe.doUntil(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				},
				function () {
					if (flag)
						throw new Error("Wrong behavior");

					return a === 5;
				}, safe.sure(done, function () {
					done(a === 5 ? null : new Error("Wrong behavior"));
				}));
		})
	})
	describe("reduce", function () {
		it("should reduce array an asynchronous iterator", function (done) {
			safe.reduce([1,2,3,4,5], 0, function (memo, item , cb) {
				setTimeout(function () {
					cb(null, memo + item);
				}, randomTime());
			}, safe.sure(done, function (result) {
				done(result !== 15 ? new Error("Wrong behavior") : null);
			}));
		})
		it("should reduce array an asynchronous iterator in reverse order", function (done) {
			safe.reduceRight([1,2,3,4,5], 15, function (memo, item , cb) {
				setTimeout(function () {
					cb(null, memo - item);
				}, randomTime());
			}, safe.sure(done, function (result) {
				done(result !== 0 ? new Error("Wrong behavior") : null);
			}));
		})
	})
	describe("apply", function () {
		it("should execute function with some arguments applied", function (done) {
			function foo (text, cb) {
				setTimeout(function () {
					cb(text === "test" ? null : new Error("Wrong behavior"));
				}, randomTime());
			}

			safe.parallel([
				safe.apply(foo, "test"),
				safe.apply(foo, "test")
			], done);
		});
	})
})
