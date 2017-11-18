const assert  = require('assert'),
      tasker = require('async-task-manager');
describe('同步异常处理', function () {
  it('异常流,', (done) => {
    const a11 = function () {
      this.finish(2);
    };
    const b11 = function (a) {
      throw new Error();
      this.finish(3 + a);
    };
    tasker(a11).to(b11).to((result, opera) => {
      if ([].toString.call(result) === '[object Error]') {
        console.log('在b任务捕捉到错误');
        opera.finish(undefined, result);
      } else {
        this.finish(result);
      }
    }).to((result, err) => {
      if (err) {
        console.log('在最后也捕捉到错误!');
      }
      done();
    }).run();
  });
  it('catch捕获异常,', (done) => {
    const a12 = function () {
      this.finish(2);
    };
    const b12 = function (a) {
      throw new Error();
      this.finish(3 + a);
    };
    tasker(a12).to(b12).to((result) => {
      console.log('计算的结果是' + result);
    }).catch((err) => {
      if (err) {
        console.log('catch捕捉到错误!');
      }
      done();
    }).run();
  });
  it('通过监听器捕捉错误', (done) => {
      const a12 = function () {
        this.finish(2);
      };
      const b12 = function (a) {
        throw new Error();
        this.finish(3 + a);
      };
      const myTask = tasker(a12).to(b12).to((result) => {
        console.log('计算的结果是' + result);
      });
      myTask.on('err', () => {
        console.log('监听器捕捉到错误!');
        done();
      });
      myTask.run();
  });
});
describe('异步任务流程', function () {
  it('简单线性结构', (done) => {
    const a21 = function () {
      setTimeout(() => {
        this.finish(3);
      }, 1000);
    };
    const b21 = function (a) {
      setTimeout(() => {
        this.finish(3 + a);
      }, 2000);
    };
    tasker(a21).to(b21).to((result) => {
      console.log(result);
      assert.equal(result, 6 , 'the result is not 6');
      done();
    }).catch((e) => {
      console.log(e);
    }).run();
  });
  it('复杂的图结构', (done) => {
    const Aa = function () {
      setTimeout(() => {
        this.finish(2);
      }, 500);
    };
    const Ab = function () {
      setTimeout(() => {
        this.finish(2);
      }, 600);
    };
    const Ba = function () {
      setTimeout(() => {
        this.finish(3);
      }, 500);
    };
    const Bb = function () {
      setTimeout(() => {
        this.finish(3);
      }, 600);
    };
    const A = tasker(Aa, Ab);
    const B = tasker(Ba, Bb);
    tasker(A, B).to((A, B) => {
      console.log(A, B);
      done();
    }).run();
  });
  it('提前完成任务', (done) => {
    const a = function () {
      setTimeout(() => {
        this.end(2);
      }, 1000);
    };
    const b = function (a) {
      setTimeout(() => {
        this.finish(3 + a);
      }, 2000);
    };
    tasker(a).to(b).to((result) => {
      console.log('b任务被跳过,所以结果是' + result);
      done();
    }).run();
  });
});
describe('模式测试', function () {
  it('竞争模式', (done) => {
    const a = function () {
      setTimeout(() => {
        this.finish('任务a');
      }, 2000);
    };
    const b = function () {
      setTimeout(() => {
        this.finish('任务b');
      }, 20);
    };
    tasker(a, b, {
      mode: 'compete'
    }).to((who) => {
      console.log(who + '率先完成');
      done();
    }).run();
  });
  it('竞争模式 end测试一', (done) => {
    const a = function () {
      setTimeout(() => {
        this.end('任务a');
      }, 1000);
    };
    const b = function () {
      setTimeout(() => {
        this.finish('任务b');
      }, 200);
    };
    tasker(b, a, {
      mode: 'compete'
    }).to((who, opera) => {
      console.log('经过中间任务');
      opera.finish(who);
      done();
    }).to((who)=> {
      console.log(who + '率先完成');
    }).run();
  });
  it('竞争模式 end测试二', (done) => {
    const a = function () {
      setTimeout(() => {
        this.finish('任务a');
      }, 1000);
    };
    const b = function () {
      setTimeout(() => {
        this.end('任务b');
      }, 200);
    };
    tasker(b, a, {
      mode: 'compete'
    }).to((who, opera) => {
      console.log('经过中间任务');
      opera.finish(who);
    }).to((who)=> {
      done();
      console.log(who + '率先完成');
    }).run();
  });
});
describe('超时处理', function () {
  it('任务超时', (done) => {
    const a = function () {
      setTimeout(() => {
        this.finish();
      }, 2000);
    };
    const b = function () {
      setTimeout(() => {
        this.finish();
      }, 20);
    };
    const myTask = tasker(a, b).to((who) => {
      console.log('任务完成');
      done();
    });
    myTask.set({
      timeout: 100
    });
    myTask.on('timeout', () => {
      done();
      console.log('任务超时，任务执行失败!');
    });
    myTask.run();
  });
  it('任务超时 - 取消任务超时监听', (done) => {
    const a = function () {
      setTimeout(() => {
        this.finish();
      }, 2000);
    };
    const b = function () {
      setTimeout(() => {
        myTask.removeAllListeners('timeout');
        this.finish();
      }, 200);
    };
    const myTask = tasker(a, b).to(() => {
      console.log('任务完成');
      done();
    });
    myTask.set({
      timeout: 1000
    });
    myTask.on('timeout', () => {
      done();
      console.log('任务超时，任务执行失败!');
    });
    myTask.run();
  });
});