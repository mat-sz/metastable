enum PickleOpcode {
  MARK = 0x28, // "("
  STOP = 0x2e, // "."
  POP = 0x30, // "0"
  POP_MARK = 0x31, //"1"
  DUP = 0x32, // "2"
  FLOAT = 0x46, // "F"
  INT = 0x49, // "I"
  BININT = 0x4a, // "J"
  BININT1 = 0x4b, // "K"
  LONG = 0x4c, // "L"
  BININT2 = 0x4d, // "M"
  NONE = 0x4e, // "N"
  PERSID = 0x50, // "P"
  BINPERSID = 0x51, // "Q"
  REDUCE = 0x52, // "R"
  STRING = 0x53, // "S"
  BINSTRING = 0x54, // "T"
  SHORT_BINSTRING = 0x55, // "U"
  UNICODE = 0x56, // "V"
  BINUNICODE = 0x58, // "X"
  APPEND = 0x61, // "a"
  BUILD = 0x62, // "b"
  GLOBAL_OPCODE = 0x63, // "c"
  DICT = 0x64, // "d"
  EMPTY_DICT = 0x7d, // "}"
  APPENDS = 0x65, // "e"
  GET = 0x67, // "g"
  BINGET = 0x68, // "h"
  INST = 0x69, // "i"
  LONG_BINGET = 0x6a, // "j"
  LIST = 0x6c, // "l"
  EMPTY_LIST = 0x5d, // "]"
  OBJ = 0x6f, // "o"
  PUT = 0x70, // "p"
  BINPUT = 0x71, // "q"
  LONG_BINPUT = 0x72, // "r"
  SETITEM = 0x73, // "s"
  TUPLE = 0x74, // "t"
  EMPTY_TUPLE = 0x29, // ")"
  SETITEMS = 0x75, // "u"
  BINFLOAT = 0x47, // "G"

  // Protocol 2
  PROTO = 0x80,
  NEWOBJ = 0x81,
  EXT1 = 0x82,
  EXT2 = 0x83,
  EXT4 = 0x84,
  TUPLE1 = 0x85,
  TUPLE2 = 0x86,
  TUPLE3 = 0x87,
  NEWTRUE = 0x88,
  NEWFALSE = 0x89,
  LONG1 = 0x8a,
  LONG4 = 0x8b,

  // Protocol 3
  BINBYTES = 0x42, // "B"
  SHORT_BINBYTES = 0x43, // "C"

  // Protocol 4
  SHORT_BINUNICODE = 0x8c,
  BINUNICODE8 = 0x8d,
  BINBYTES8 = 0x8e,
  EMPTY_SET = 0x8f,
  ADDITEMS = 0x90,
  FROZENSET = 0x91,
  NEWOBJ_EX = 0x92,
  STACK_GLOBAL = 0x93,
  MEMOIZE = 0x94,
  FRAME = 0x95,

  // Protocol 5
  BYTEARRAY8 = 0x96,
  NEXT_BUFFER = 0x97,
  READONLY_BUFFER = 0x98,
}

// Adapted from: https://github.com/jlaine/node-jpickle/blob/master/lib/jpickle.js
// TODO: Confirm whether only BINUNICODE values are needed and skip the rest.
export function unpickle(data: Buffer) {
  const mark = 'THIS-NEEDS-TO-BE-UNIQUE-TO-SERVE-AS-A-BOUNDARY';
  const memo: any = {};
  let stack: any[] = [];

  function marker() {
    let k = stack.length - 1;
    while (k > 0 && stack[k] !== mark) {
      --k;
    }
    return k;
  }

  function readLine() {
    let str = '';
    let current = data.readInt8(offset++);

    while (current !== 0x0a) {
      str += String.fromCharCode(current);
      current = data.readInt8(offset++);
    }

    return str;
  }

  let offset = 0;
  while (offset < data.byteLength) {
    const opcode = data.readUInt8(offset++) as PickleOpcode;
    switch (opcode) {
      case PickleOpcode.PROTO:
        {
          data.readUInt8(offset++);
        }
        break;
      case PickleOpcode.TUPLE1:
        {
          const a = stack.pop();
          stack.push([a]);
        }
        break;
      case PickleOpcode.TUPLE2:
        {
          const b = stack.pop();
          const a = stack.pop();
          stack.push([a, b]);
        }
        break;
      case PickleOpcode.TUPLE3:
        {
          const c = stack.pop();
          const b = stack.pop();
          const a = stack.pop();
          stack.push([a, b, c]);
        }
        break;
      case PickleOpcode.NEWTRUE:
        stack.push(true);
        break;
      case PickleOpcode.NEWFALSE:
        stack.push(false);
        break;
      case PickleOpcode.LONG1:
        {
          const length = data.readUInt8(offset++);
          // FIXME: actually decode LONG1
          offset += length;
          stack.push(0);
        }
        break;
      case PickleOpcode.LONG4:
        {
          const length = data.readUInt32LE(offset);
          offset += 4;
          // FIXME: actually decode LONG4
          offset += length;
          stack.push(0);
        }
        break;
      // protocol 0 and protocol 1
      case PickleOpcode.POP:
        stack.pop();
        break;
      case PickleOpcode.POP_MARK:
        {
          const mark = marker();
          stack = stack.slice(0, mark);
        }
        break;
      case PickleOpcode.DUP:
        {
          const value = stack[stack.length - 1];
          stack.push(value);
        }
        break;
      case PickleOpcode.EMPTY_DICT:
        stack.push({});
        break;
      case PickleOpcode.EMPTY_LIST:
      case PickleOpcode.EMPTY_TUPLE:
        stack.push([]);
        break;
      case PickleOpcode.GET:
        {
          const index = readLine();
          stack.push(memo[index]);
        }
        break;
      case PickleOpcode.BINGET:
        {
          const index = data.readUInt8(offset++);
          stack.push(memo['' + index]);
        }
        break;
      case PickleOpcode.LONG_BINGET:
        {
          const index = data.readUInt32LE(offset);
          offset += 4;
          stack.push(memo['' + index]);
        }
        break;
      case PickleOpcode.PUT:
        {
          const index = readLine();
          memo[index] = stack[stack.length - 1];
        }
        break;
      case PickleOpcode.BINPUT:
        {
          const index = data.readUInt8(offset++);
          memo['' + index] = stack[stack.length - 1];
        }
        break;
      case PickleOpcode.LONG_BINPUT:
        {
          const index = data.readUInt32LE(offset);
          offset += 4;
          memo['' + index] = stack[stack.length - 1];
        }
        break;
      case PickleOpcode.GLOBAL_OPCODE:
        {
          // TODO: Actually support some of the common functions.
          readLine();
          readLine();
          stack.push(undefined);
        }
        break;
      case PickleOpcode.OBJ:
        {
          const obj = new (stack.pop())();
          const mark = marker();
          for (let pos = mark + 1; pos < stack.length; pos += 2) {
            obj[stack[pos]] = stack[pos + 1];
          }
          stack = stack.slice(0, mark);
          stack.push(obj);
        }
        break;
      case PickleOpcode.BUILD:
        {
          const dict = stack.pop();
          const obj = stack.pop();
          for (const p in dict) {
            obj[p] = dict[p];
          }
          stack.push(obj);
        }
        break;
      case PickleOpcode.REDUCE:
        {
          // TODO: Actually support some of the common functions.
          stack.pop();
          stack[stack.length - 1] = {};
        }
        break;
      case PickleOpcode.INT:
        {
          const value = readLine();
          if (value == '01') stack.push(true);
          else if (value == '00') stack.push(false);
          else stack.push(parseInt(value));
        }
        break;
      case PickleOpcode.BININT:
        stack.push(data.readInt32LE(offset));
        offset += 4;
        break;
      case PickleOpcode.BININT1:
        stack.push(data.readUInt8(offset));
        offset += 1;
        break;
      case PickleOpcode.BININT2:
        stack.push(data.readUInt16LE(offset));
        offset += 2;
        break;
      case PickleOpcode.MARK:
        stack.push(mark);
        break;
      case PickleOpcode.FLOAT:
        {
          const value = readLine();
          stack.push(parseFloat(value));
        }
        break;
      case PickleOpcode.LONG:
        {
          const value = readLine();
          stack.push(parseInt(value));
        }
        break;
      case PickleOpcode.BINFLOAT:
        stack.push(data.readDoubleBE(offset));
        offset += 8;
        break;
      case PickleOpcode.STRING:
        {
          const value = readLine();
          if (value[0] === "'") {
            if (value[value.length - 1] !== "'") throw 'insecure string pickle';
          } else if (value[0] === '"') {
            if (value[value.length - 1] !== '"') throw 'insecure string pickle';
          } else {
            throw 'insecure string pickle';
          }
          stack.push(value.substr(1, value.length - 2));
        }
        break;
      case PickleOpcode.UNICODE:
        {
          const value = readLine();
          stack.push(value);
        }
        break;
      case PickleOpcode.BINSTRING:
      case PickleOpcode.BINBYTES:
        {
          const length = data.readUInt32LE(offset);
          offset += 4;
          stack.push(data.toString('binary', offset, offset + length));
          offset += length;
        }
        break;
      case PickleOpcode.SHORT_BINSTRING:
      case PickleOpcode.SHORT_BINBYTES:
        {
          const length = data.readUInt8(offset++);
          stack.push(data.toString('binary', offset, offset + length));
          offset += length;
        }
        break;
      case PickleOpcode.BINUNICODE:
        {
          const length = data.readUInt32LE(offset);
          offset += 4;
          stack.push(data.toString('utf8', offset, offset + length));
          offset += length;
        }
        break;
      case PickleOpcode.APPEND:
        {
          const value = stack.pop();
          stack[stack.length - 1].push(value);
        }
        break;
      case PickleOpcode.APPENDS:
        {
          const mark = marker();
          const list = stack[mark - 1];
          list.push(...stack.slice(mark + 1));
          stack = stack.slice(0, mark);
        }
        break;
      case PickleOpcode.SETITEM:
        {
          const value = stack.pop();
          const key = stack.pop();
          stack[stack.length - 1][key] = value;
        }
        break;
      case PickleOpcode.SETITEMS:
        {
          const mark = marker();
          const obj: any = stack[mark - 1];
          for (let pos = mark + 1; pos < stack.length; pos += 2) {
            obj[stack[pos]] = stack[pos + 1];
          }
          stack = stack.slice(0, mark);
        }
        break;
      case PickleOpcode.LIST:
      case PickleOpcode.TUPLE:
        {
          const mark = marker();
          const list = stack.slice(mark + 1);
          stack = stack.slice(0, mark);
          stack.push(list);
        }
        break;
      case PickleOpcode.DICT:
        {
          const mark = marker();
          const obj: any = {};
          for (let pos = mark + 1; pos < stack.length; pos += 2) {
            obj[stack[pos]] = stack[pos + 1];
          }
          stack = stack.slice(0, mark);
          stack.push(obj);
        }
        break;
      case PickleOpcode.STOP:
        return stack.pop();
      case PickleOpcode.NONE:
      case PickleOpcode.PERSID:
      case PickleOpcode.BINPERSID:
        stack.push({});
        break;
      default:
        throw "Unhandled opcode '" + opcode + "'";
    }
  }
}
