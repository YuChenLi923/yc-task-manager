/**
 * 异步任务管理器
 *
 * @author      YuChenLi923<liyc_code@163.com>
 */
const isPlainObject = require('lodash.isplainobject');
function createTaskList(tasks) {
  let result = [];
  if (Array.isArray(tasks)) {
    tasks.forEach((task) => {
      if (typeof task === 'function') {
        result.push(new Task(result.length, task, this));
      } else if (task instanceof TaskManager) {
        task.belong = this;
        task.index = result.length;
        result.push(task);
      }
    });
  }
  return result;
}

function Task(index, cb, belong) {
  this.index = index;
  this.cb = cb;
  this.fired = false;
  this.belong = belong;
}

Object.assign(Task.prototype, {
  run() {
    const {cb, finish, end, belong} = this;
    try {
      cb.call(this, ...arguments, {
        finish: finish.bind(this),
        end: end.bind(this)
      });
    } catch (err) {
      if (!this.fired) {
        if (typeof belong.errHandler === 'function') {
          belong.disable();
          belong.errHandler(err);
        } else {
          this.finish(err);
        }
      }
    }
  },
  finish() {
    if (!this.fired) {
      let belong = this.belong;
      belong.dataList[this.index] = arguments.length > 1 ? [...arguments] : arguments[0];
      belong.finishNum += 1;
      this.fired = true;
      if (belong.finishNum === belong.taskLen) {
        belong.run(...belong.dataList);
      }
    }
  },
  end(data) {
    let belong = this.belong;
    if (belong.waitList.length > 0) {
      belong.finishNum = 0;
      belong.taskList = belong.waitList.pop();
      belong.waitList = [];
      belong.run(data);
    }
  }
});

function TaskManager() {
  if (this instanceof TaskManager) {
    this.Init(...arguments);
  } else {
    return new TaskManager(...arguments);
  }
}
TaskManager.prototype = {
  constructor: TaskManager,
  finish: Task.prototype.finish,
  Init() {
    let args = [...arguments],
        len = args.length,
        options = args[len - 1],
        baseOptions = {
          mode: 'i'
        };
    (isPlainObject(options) && args.pop()) || (options = {});
    Object.assign(this, options, baseOptions, options);
    this.to(...arguments);
  },
  to() {
    let tasks = createTaskList.call(this, [...arguments]),
        len = tasks.length;
    if (this.taskList && this.taskList.length > 0) {
      this.waitList[this.waitList.length] = tasks;
    } else {
      this.taskList = tasks;
      this.taskLen = len;
      this.waitList = [];
      this.dataList = [];
      this.finishNum = 0;
      this.cacheData = [];
      this.belong = null;
    }
    return this;
  },
  run() {
    if (this.finishNum === this.taskLen) {
      this.taskList = this.waitList.shift();
      this.finishNum = 0;
      this.cacheData = this.dataList;
      this.dataList = [];
    }
    if (this.taskList) {
      this.taskLen = this.taskList.length;
      this.taskList.forEach((task) => {
        task.run(...arguments);
      });
    } else if (this.belong) {
      this.finish(...this.cacheData);
    }
  },
  stop() {
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
    this.errHandler = errHandler;
    return this;
  }
};
module.exports = TaskManager;
