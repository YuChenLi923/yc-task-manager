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
        finishNum: 0,
        firedNum: 0,
        cacheData: [],
        belong: null
      };
function createTaskList(tasks, options) {
  let result = [];
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
    result.mode = options.mode;
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
      assgin(this, taskerConfig, true);
      this.waitList = [];
    }
    return this;
  },
  run() {
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
    } else if (this.belong) {
      this.finish(...this.cacheData);
    }
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
    this.errHandler = errHandler;
    return this;
  }
});

module.exports = TaskManager;
