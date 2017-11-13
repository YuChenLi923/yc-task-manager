import tasker from 'async-task-manager';
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
        console.log('捕捉到错误!');
      }
      done();
    }).run();
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
        console.log(3 + a);
        done();
      }, 2000);
    };
    tasker(a21).to(b21).run();
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
      done();
    }).to((who)=> {
      console.log(who + '率先完成');
    }).run();
  });
});