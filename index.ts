import {merge} from "react-merge";
import {getIn, objMap, resolvePath, string2path} from "objects-fns";
import {isArray, isFunction, isMergeable, isString, isUndefined} from "is-fns";

const isElemRef = (val: any) => isString(val) && (val.substr(0, 2) == '^/' || val.substr(0, 2) == '^.');

function testRef(refRes: any, $_ref: string, track: string[]) {
  if (isUndefined(refRes))
    throw new Error('Reference "' + $_ref + '" leads to undefined object\'s property in path: ' + track.join('/'));
  return true;
}

function getInWithCheck(refRes: any, path: any[]) {
  let elems = refRes['^'];
  let whileBreak = false;
  while (!whileBreak) {
    whileBreak = true;
    for (let j = 0; j < path.length; j++) {
      refRes = getIn(refRes, path[j]);
      if (isElemRef(refRes)) {
        path = string2path(refRes).concat(path.slice(j + 1));
        refRes = {'^': elems};
        whileBreak = false;
        break;
      }
      if (isFunction(refRes) && j + 1 !== path.length) { // check if there is a function
        refRes = refRes(elems, path.slice(j + 1));
        break;
      }
      if (isUndefined(refRes)) break;
    }
  }
  return refRes
}

function skipKey(key: string, obj?: any, opts: any = {}) {
  let {start = '_$', field = '_$skipKeys'} = opts;
  if (!isString(key)) return false;
  return key === field || key.substr(0, start.length) == start || obj && isArray(obj[field]) && ~obj[field].indexOf(key)
}

function processRef($_refs: any, _elements: any, opts: any, track: any, baseObj: any) {
  $_refs = $_refs.split(':');
  let {isRef} = opts;
  const objs2merge: any[] = [];
  for (let i = 0; i < $_refs.length; i++) {
    if (!$_refs[i]) continue;
    if (!isRef($_refs[i]))
      throw new Error(`Non-ref value "${$_refs[i]}" in path "${track.concat('/')}"`);
    let $_ref = $_refs[i];
    let refRes;
    if ($_ref[1] === '.') $_ref = resolveRelativeObject(baseObj, $_ref, track, opts);
    if (isRef($_ref)) {
      let path = string2path($_ref);
      refRes = getInWithCheck({'^': _elements}, path);
    } else refRes = $_ref;
    testRef(refRes, $_refs[i], track.concat('@' + i));
    if (isMergeable(refRes)) refRes = objectResolver(_elements, refRes, opts, track, baseObj);
    objs2merge.push(refRes);
  }
  if (objs2merge.length <= 1) return objs2merge[0];
  let result = objs2merge[0];
  for (let i = 1; i < objs2merge.length; i++) {
    if (objs2merge[i]._$setSelfIn && result) {
      let {_$setSelfIn, ...restRes} = objs2merge[i];
      result = merge(restRes, result, {path: _$setSelfIn});
    } else
      result = merge(result, objs2merge[i]);
  }
  return result
}


function resolveRelativeObject(obj: any, ref: any, track: any[], opts: any) {
  while (opts.isRef(ref) && ref[1] === '.') {
    let path = resolvePath(string2path(ref.substr(1)), track);
    ref = getIn(obj, path);
  }
  return ref
}

function objectResolver(_elements: any, obj2deref: any, opts: any = {}, track: string[] = [], baseObj: any = obj2deref): any {
  let {isRef = isElemRef, refHandler, skipKey: skipFn = skipKey} = opts;
  opts = {isRef, refHandler, skipKey: skipFn};
  if (isRef(obj2deref)) {
    let result = refHandler ? refHandler(_elements, obj2deref, opts, track, getIn(baseObj, track.slice(0, -1))) : obj2deref;
    if (isRef(result))
      result = processRef(result, _elements, opts, track, baseObj);
    return result;
  }
  if (!isMergeable(obj2deref)) return obj2deref;

  if (isArray(obj2deref)) return obj2deref.map((obj: any, i: any) => objectResolver(_elements, obj, opts, track.concat(i), baseObj));
  let {$_ref = '', ...restObj} = obj2deref;
  let result = processRef($_ref, _elements, opts, track, baseObj);

  return merge(result, objMap(restObj, (obj, tr) => {
    let key = tr[tr.length - 1];
    if (!isRef(obj) && skipFn(key, obj2deref)) return obj;
    return objectResolver(_elements, obj, opts, tr, baseObj)
  }, track));
  //objKeys(restObj).forEach(key => result[key] = isMergeable(restObj[key]) ? objectDerefer(_objects, restObj[key]) : restObj[key]);
}


export {isElemRef, objectResolver, skipKey}
