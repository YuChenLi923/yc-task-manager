import tasker from 'async-task-manager';
describe('异步任务流程', function () {
  it('简单线性结构', (done) => {
    const a = function () {
      setTimeout(() => {
        this.finish(2);
      }, 1000);
    };
    const b = function (a) {
      setTimeout(() => {
        this.finish(3 + a);
      }, 2000);
    };
    tasker(a).to(b).to((result) => {
      console.log(result);
      done();
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
describe('同步异常处理', function () {
  it('异常流,', (done) => {
    const a = function () {
      this.finish(2);
    };
    const b = function (a) {
      throw new Error();
      this.finish(3 + a);
    };
    tasker(a).to(b).to((result) => {
      if ([].toString.call(result) === '[object Error]') {
        console.log('在b任务捕捉到错误');
        this.finish(undefined, result);
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
    const a = function () {
      this.finish(2);
    };
    const b = function (a) {
      throw new Error();
      this.finish(3 + a);
    };
    tasker(a).to(b).to((result) => {
      console.log('计算机的结果是' + result);
    }).catch((err) => {
      if (err) {
        console.log('捕捉到错误!');
      }
      done();
    }).run();
  });
});