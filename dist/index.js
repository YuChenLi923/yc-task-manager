'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * 异步任务管理器
 *
 * @author      YuChenLi923<liyc_code@163.com>
 */
var isPlainObject = require('lodash.isplainobject'),
    assgin = require('./utils/yc-assign'),
    taskerConfig = {
  waitList: [],
  dataList: [],
  eventListeners: {},
  finishNum: 0,
  firedNum: 0,
  running: false,
  cacheData: [],
  belong: null,
  config: {
    mode: 'normal',
    timeout: 0
  }
};
function createTaskList(tasks, options) {
  var _this = this;

  var result = [],
      config = this.config;
  if (Array.isArray(tasks)) {
    tasks.forEach(function (task) {
      if (typeof task === 'function') {
        var newtask = new Task(result.length, task, _this);
        newtask.list = result;
        result.push(newtask);
      } else if (task instanceof TaskManager) {
        task.belong = _this;
        task.index = result.length;
        result.push(task);
        task.list = result;
      }
    });
    result.mode = options.mode || config.mode;
    result.finished = false;
  }
  return result;
}

function Task(index, cb, belong) {
  this.index = index;
  this.cb = cb;
  this.fired = false;
  this.belong = belong;
}

assgin(Task.prototype, {
  run: function run() {
    var cb = this.cb,
        finish = this.finish,
        end = this.end,
        belong = this.belong;

    try {
      cb.call.apply(cb, [this].concat(Array.prototype.slice.call(arguments), [{
        finish: finish.bind(this),
        end: end.bind(this)
      }]));
    } catch (err) {
      if (!this.fired) {
        if (belong.eventListeners['err']) {
          belong.disable();
          belong.emit('err', err);
        } else {
          this.finish(err);
        }
      }
    }
  },
  finish: function finish() {
    if (!this.fired && !this.list.finished) {
      var belong = this.belong,
          mode = this.list.mode;
      this.fired = true;
      switch (mode) {
        case 'compete':
          belong.dataList[0] = arguments.length > 1 ? [].concat(Array.prototype.slice.call(arguments)) : arguments[0];
          this.list.finished = true;
          belong.finishNum = belong.taskLen;
          belong.run.apply(belong, _toConsumableArray(belong.dataList));
          break;
        case 'normal':
        default:
          belong.dataList[this.index] = arguments.length > 1 ? [].concat(Array.prototype.slice.call(arguments)) : arguments[0];
          belong.finishNum += 1;
          if (belong.finishNum === belong.taskLen) {
            this.list.finished = true;
            belong.run.apply(belong, _toConsumableArray(belong.dataList));
          }
          break;
      }
    }
  },
  end: function end() {
    var belong = this.belong;
    if (belong.waitList.length > 0 && !this.list.finished) {
      belong.finishNum = 0;
      belong.taskList = belong.waitList.pop();
      belong.waitList = [];
      belong.run.apply(belong, arguments);
      this.list.finished = true;
    }
  },
  err: function err(_err) {
    var belong = this.belong;
    belong.emit('err', _err);
  }
});

function TaskManager() {
  if (this instanceof TaskManager) {
    this.init.apply(this, arguments);
  } else {
    return new (Function.prototype.bind.apply(TaskManager, [null].concat(Array.prototype.slice.call(arguments))))();
  }
}
assgin(TaskManager.prototype, {
  finish: Task.prototype.finish,
  init: function init() {
    assgin(this, taskerConfig, true);
    this.to.apply(this, arguments);
  },
  to: function to() {
    var args = [].concat(Array.prototype.slice.call(arguments)),
        tasks = void 0,
        len = args.length,
        options = args[len - 1],
        baseOptions = {
      mode: 'normal'
    };
    isPlainObject(options) && args.pop() || (options = {});
    tasks = createTaskList.call(this, args, assgin(baseOptions, options, true));
    len = tasks.length;
    if (this.taskList && this.taskList.length > 0) {
      this.waitList[this.waitList.length] = tasks;
    } else {
      this.taskList = tasks;
      this.taskLen = len;
      this.waitList = [];
    }
    return this;
  },
  on: function on(event, cb) {
    !this.eventListeners[event] && (this.eventListeners[event] = []);
    typeof cb === 'function' && this.eventListeners[event].push(cb);
  },
  emit: function emit() {
    var args = [].concat(Array.prototype.slice.call(arguments)),
        event = args.shift();
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(function (cb) {
        cb.apply(undefined, _toConsumableArray(args));
      });
    }
  },
  removeListener: function removeListener(event, cb) {
    if (this.eventListeners[event]) {
      var index = this.eventListeners[event].indexOf(cb);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  },
  removeAllListeners: function removeAllListeners(event) {
    delete this.eventListeners[event];
  },
  run: function run() {
    var _this2 = this,
        _arguments = arguments;

    var timeout = this.config.timeout;

    if (!this.running) {
      this.startTime = +new Date();
      this.running = true;
      if (timeout) {
        this.timer = setTimeout(function () {
          if (_this2.eventListeners['timeout']) {
            _this2.emit('timeout');
            _this2.disable();
          }
        }, timeout);
      }
    }
    if (this.finishNum === this.taskLen) {
      this.taskList = this.waitList.shift();
      this.finishNum = 0;
      this.firedNum = 0;
      this.cacheData = this.dataList;
      this.dataList = [];
    }
    if (this.taskList) {
      this.taskLen = this.taskList.length;
      this.taskList.forEach(function (task) {
        ++_this2.firedNum;
        task.run.apply(task, _arguments);
      });
    } else {
      this.endTime = +new Date();
      clearTimeout(this.timer);
      if (this.belong) {
        this.finish.apply(this, _toConsumableArray(this.cacheData));
      }
    }
  },
  set: function set(config) {
    assgin(this.config, config, true);
  },
  stop: function stop() {
    this.firedNum !== this.taskLen && this.waitList.unshift(this.taskList.slice(this.firedNum - 1));
    this.taskList = [];
    this.finishNum = this.taskLen = 0;
    return this;
  },
  continue: function _continue() {
    if (!this.disabled) {
      this.run.apply(this, _toConsumableArray(this.cacheData));
    }
    return this;
  },
  disable: function disable() {
    this.taskList = this.waitList = [];
    this.disabled = true;
  },
  catch: function _catch(errHandler) {
    this.on('err', errHandler);
    return this;
  }
});

module.exports = TaskManager;