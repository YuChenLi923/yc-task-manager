/**
 * 异步任务管理器
 *
 * @author      YuChenLi923<liyc_code@163.com>
 */
const isPlainObject = require('lodash.isplainobject'),
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
  let result = [],
      config = this.config;
  if (Array.isArray(tasks)) {
    tasks.forEach((task) => {
      if (typeof task === 'function') {
        let newtask = new Task(result.length, task, this);
        newtask.list = result;
        result.push(newtask);
      } else if (task instanceof TaskManager) {
        task.belong = this;
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
  run() {
    const {cb, finish, end, belong} = this;
    try {
      cb.call(this, ...arguments, {
        finish: finish.bind(this),
        end: end.bind(this)
      });
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
  finish() {
    if (!this.fired && !this.list.finished) {
      let belong = this.belong,
          mode = this.list.mode;
      this.fired = true;
      switch (mode) {
        case 'compete':
          belong.dataList[0] = arguments.length > 1 ? [...arguments] : arguments[0];
          this.list.finished = true;
          belong.finishNum = belong.taskLen;
          belong.run(...belong.dataList);
          break;
        case 'normal':
        default:
          belong.dataList[this.index] = arguments.length > 1 ? [...arguments] : arguments[0];
          belong.finishNum += 1;
          if (belong.finishNum === belong.taskLen) {
            this.list.finished = true;
            belong.run(...belong.dataList);
          }
          break;
      }
    }
  },
  end() {
    let belong = this.belong;
    if (belong.waitList.length > 0 && !this.list.finished) {
      belong.finishNum = 0;
      belong.taskList = belong.waitList.pop();
      belong.waitList = [];
      belong.run(...arguments);
      this.list.finished = true;
    }
  },
  err(err) {
    let belong = this.belong;
    belong.emit('err', err);
  }
});

function TaskManager() {
  if (this instanceof TaskManager) {
    this.init(...arguments);
  } else {
    return new TaskManager(...arguments);
  }
}
assgin(TaskManager.prototype, {
  finish: Task.prototype.finish,
  init() {
    assgin(this, taskerConfig, true);
    this.to(...arguments);
  },
  to() {
    let args = [...arguments],
        tasks,
        len = args.length,
        options = args[len - 1],
        baseOptions = {
          mode: 'normal'
        };
    (isPlainObject(options) && args.pop()) || (options = { });
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
  on(event, cb) {
    !this.eventListeners[event] && (this.eventListeners[event] = []);
    typeof cb === 'function' && (this.eventListeners[event].push(cb));
  },
  emit() {
    const args = [...arguments],
          event = args.shift();
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((cb) => {
        cb(...args);
      });
    }
  },
  removeListener(event, cb) {
    if (this.eventListeners[event]) {
      let index = this.eventListeners[event].indexOf(cb);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  },
  removeAllListeners(event) {
    delete this.eventListeners[event];
  },
  run() {
    const { timeout } = this.config;
    if (!this.running) {
      this.startTime = +new Date();
      this.running = true;
      if (timeout) {
        this.timer = setTimeout(() => {
          if (this.eventListeners['timeout']) {
            this.emit('timeout');
            this.disable();
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
      this.taskList.forEach((task) => {
        ++this.firedNum;
        task.run(...arguments);
      });
    } else {
      this.endTime = +new Date();
      clearTimeout(this.timer);
      if (this.belong) {
        this.finish(...this.cacheData);
      }
    }
  },
  set(config) {
    assgin(this.config, config, true);
  },
  stop() {
    this.firedNum !== this.taskLen && this.waitList.unshift(this.taskList.slice(this.firedNum - 1));
    this.taskList = [];
    this.finishNum = this.taskLen = 0;
    return this;
  },
  continue() {
    if (!this.disabled) {
      this.run(...this.cacheData);
    }
    return this;
  },
  disable() {
    this.taskList = this.waitList = [];
    this.disabled = true;
  },
  catch(errHandler) {
    this.on('err', errHandler);
    return this;
  }
});

module.exports = TaskManager;
