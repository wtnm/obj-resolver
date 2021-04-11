

<!-- toc -->



<!-- tocstop -->

## Overview
`obj-resolver` - Функция, которая упрощает наследование и объединение свойств объекта относительно него самого или относительно другого объекта.


## Installation

Установить текущую версию:

```
npm install --save obj-resolver

```

## Usage
```
import {objectResolver} from 'obj-resolver'
```

## Documentation
`objectResolver(mainObject: anyObject, objectToResolve: anyObject)`

Функция резолвит объект `objectToResolve` относительно `mainObject` по следующим правилам:

- Если у свойства внутри `objectToResolve`, которое является объектом есть свойство `$_ref`, то оно изымается, затем берется значение из объекта `mainObject` по пути из `$_ref`, после чего это значение объединяется с объектом.
Пример: 
```
    let main = {one: {two: 3}};
    let derivative = {$_ref: '^/one', four: 5};
    let result = objectResolver(main, derivative);
    console.log(result); // {two: 3,  four: 5}
```

- Свойства объекта проверяются, это это строка и она начнается с `^/`, то это свойство заменяется значением из объекта `mainObject` по указанному пути.
Пример: 
```
    let main = {one: {two: 3}};
    let derivative = {five: '^/one/two', four: 5};
    let result = objectResolver(main, derivative);
    console.log(result); // {five: 3,  four: 5}
```

- Если свойство является объектом, то этот объект обрабатывается рекурсивно .
Пример: 
```
    let main = {one: {two: 3}};
    let derivative = {six: (seven: '^/one/two'), four: 5};
    let result = objectResolver(main, derivative);
    console.log(result); // {six: (seven: 3},  four: 5}
```

Свойство `$_ref` поддерживает объединение нескольких объектов через разделитель `:`. 
Пример: 
```
    let main = {one: {two: 3}, nine:{ ten: 11}};
    let derivative = {$_ref: '^/one:^/nine', four: 5};
    let result = objectResolver(main, derivative);
    console.log(result); // {two: 3,  ten: 11,  four: 5}
```

Так же поддерживаются относительные пути вида `^.` и `^..`, при этом значение берутся относительно `objectToResolve`.
Пример: 
```
    let main = {one: {two: 3}};
    let derivative = {zero: {one: 0}, four: 5, eleven: {$_ref: '^../zero'};
    let result = objectResolver(main, derivative);
    console.log(result); // {zero:  {one: 0},  four: 5, eleven: {one: 0}
```

Если свойство начинается с `_$` или если у объкта есть свойство `_$skipKeys`, где перечислены свойства, то эти свойства пропускаются при обработке и остаются неизменными.
