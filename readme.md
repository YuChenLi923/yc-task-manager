# yc-task-manager
[![Build Status](https://travis-ci.org/YuChenLi923/yc-task-manager.svg?branch=master)](https://travis-ci.org/YuChenLi923/yc-task-manager)
![NPM version](https://badge.fury.io/js/yc-task-manager.svg)
![Downloads](http://img.shields.io/npm/dm/yc-task-manager.svg?style=flat)
[![Coverage Status](https://coveralls.io/repos/github/YuChenLi923/yc-task-manager/badge.svg?branch=master)](https://coveralls.io/github/YuChenLi923/yc-task-manager?branch=master)

能够简单地在游览器中或者node中去处理复杂的异步任务,

## 快速开始

```
const tasker = require('yc-task-manager');
const a = function () {
    setTimeout(()=> {
        this.finish(2);
    }, 1000);
};
const b = function () {
    setTimeout(() => {
     this.finish(3);
    }, 500);
};
// 创建一个任务管理器并分配任务
const myTasker = tasker(a, b).to((aResult, bResult) => {
  console.log(aResult + bResult);
});

// 运行任务
myTasker.run();

```

## API

### tasker([...tasks][,options])

tasker是一个构造函数,你可以通过new来创建一个任务管理对象,当然也可以像上面的栗子那样直接调用该函数，这也可以创建一个任务管理对象.

- [...tasks]

  task必须是可执行的函数列表,它代表一个任务队列

- options

 这个任务队列的配置选项
 - mode 此任务队列执行的模式,可选:'normal', 'compete'
    - normal 普通模式,默认 只有当所以任务执行完毕后才能执行下一个任务队列
    - compete 竞争模式, 任务队列中一旦有一个任务完成，那么就执行下一个任务队列
### tasker.to([...tasks][,options])
将传入的所以任务推入下一个执行的任务队列

- options
 这个任务队列的配置选项

### tasker.set([option])

设置这个tasker的全局配置,如果正在执行的任务队列没有指定的options则,则这个任务队列的配置就是全局的配置,跟任务队列的options不同的是，这里还可以配置整个任务的超时时间。

- timeout <string> 规定超时的时间(ms),如果超时将会触发timeout事件(如果绑定了timeout事件的话)

### tasker.on(event, cb)

- event <string> 事件类型,既可以绑定自定义类型,也可以绑定yc-task-manager指定的一些事件类型
  - err 当发生错误的时候,会触发这个事件
  - timeout 当任务超时时会触发,触发后会立刻终止整个任务的执行!

- cb <function> 事件触发后的回调函数

### tasker.emit(event)

触发绑定在该tasker身上指定的event事件

### tasker.removeListener(event, cb)

移除指定事件的指定的绑定函数

### tasker.removeAllListener(event)

移除指定事件所有的绑定的回调函数

### tasker.run()
运行tasker

### tasker.stop()
停止当前的tasker的运行,但是无法停止正在执行的任务。

### tasker.catch(errHandler)

- errHandler(err)
错误处理啊函数,仅能捕捉到同步任务导致的任务, 当调用这个函数时, 会立即禁止taser的运行。如果是异步任务发送错误,那么只能通过调用task.err()才能触发。

### tasker.continue()
继续当前的tasker的运行

### tasker.disable()
禁止tasker的运行,禁止之后将无法通过continue()继续执行之后的任务


### task([...results], opera)

当我们将函数添加到tasker时,函数将会被包装成一个task,但这个函数执行时，会向其传入上一个任务队列执行的结果(如果存在的话)以及该task的操作对象opera,如果传入的函数是一个非箭头函数的话，在包装成task之后，它的this会指向这个task，所以你可以向上面个的例子直接调用this.finish()触发这个任务已经完成。但是有时候如果是箭头函数,由于箭头函数本身没有this,所以只能通过opera操作对象来触发任务完成等事件。
- results

 results对于上一个任务队列的执行结果列表，注意它是一一对应，就如刚开始举的栗子那样。
- opera

 操作对象
 - end
  对应task.end
 - finish
  对应task.finish
 - err
  对应task.err

### task.finish([result])
表示这个任务已经完成了,然后会根据所在任务队列的执行模式选择如何去执行下一个任务队列。
- result

 该任务的执行完的结果，结果可以为任意合法的数据类型，它将会和跟它处于同一个任务队列的其他任务一起将结果传入下一个将执行的任务队列。

### task.end([result])
表示这个任务已经完成了,与finish不同的是,end不会受到mode的影响,一旦调用end,那么就会立即将result传入最后一个将执行的任务队列,并且会跳过后面的任务队列,直接执行最后一个任务队列。
- result

 该任务的执行完的结果，结果可以为任意合法的数据类型，它将会将结果传入最后一个将执行的任务队列。

### task.err([err])
表示这个任务在执行过程中发送错误，因此会立即禁止该tasker的执行, 在执行同步任务中不需要调用err(),会自动捕捉到错误并交给我们定义的错误处理函数处理。

## 嵌套
tasker可以相互嵌套，这意味着不仅仅可以处理简单的线形任务流程，还可以处理类似图的流程。

```
const tasker = require('yc-task-manager');
const Aa = function() {
   setTimeout(() => {
    this.finish(1);
   }, 1000);
}
const Ab = function() {
   setTimeout(() => {
    this.finish(2);
   }, 500);
}

const Ba = function() {
   setTimeout(() => {
    this.finish(3);
   }, 1000);
}
const Bb = function() {
   setTimeout(() => {
    this.finish(4);
   }, 2000);
}
const A = tasker(Aa, Ab);
const B = tasker(Ba, Bb);
tasker(A, B).run((a, b) => {
    console.log(a, b);// [1, 2], [3, 4]
});
```

tasker也可以与任务函数嵌套在一起

```
const tasker = require('yc-task-manager');
const Aa = function() {
   setTimeout(() => {
    this.finish(1);
   }, 1000);
}
const Ab = function() {
   setTimeout(() => {
    this.finish(2);
   }, 500);
}
const A = tasker(Aa, Ab).to(function(AaResult, AbResult){
    this.finish(AaResult + AbResult);
});
const B = function() {
    setTimeout(()=> {
        this.finish(3);
    }, 200);
};
tasker(A, B).to((AResult, BResult) => {
  console.log(AResult + BResult); // 3 + 3 = 6
});
```