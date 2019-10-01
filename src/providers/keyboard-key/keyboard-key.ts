import { Injectable } from '@angular/core';
// 通过npm库keyboard-key 1.0.4版本改造得到该provider
// 仅适用于美式键盘布局
@Injectable()
export class KeyboardKeyProvider {
  private codes:any = {};
  constructor() {
    this.codes = {
      // ----------------------------------------
      // By Code
      // ----------------------------------------
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut',
    }
    
    // Function Keys (F1-24)
    for (var i = 0; i < 24; i += 1) {
      this.codes[112 + i] = 'F' + (i + 1)
    }
    
    // Alphabet (a-Z)
    for (var j = 0; j < 26; j += 1) {
      var n = j + 65
      this.codes[n] = [String.fromCharCode(n + 32), String.fromCharCode(n)]
    }
  }

  private isObject(val) {
    return val !== null && !Array.isArray(val) && typeof val === 'object';
  }

  public getCode(eventOrKey) {
    if (this.isObject(eventOrKey)) {
      return eventOrKey.keyCode || eventOrKey.which || this[eventOrKey.key]
    }
    return this[eventOrKey]
  }

  public getKey(eventOrCode) {
    var isEvent = this.isObject(eventOrCode)
    // handle events with a `key` already defined
    if (isEvent && eventOrCode.key) {
      return eventOrCode.key
    }
    var name = this.codes[isEvent ? eventOrCode.keyCode || eventOrCode.which : eventOrCode]
    if (Array.isArray(name)) {
      if (isEvent) {
        name = name[eventOrCode.shiftKey ? 1 : 0]
      } else {
        name = name[0]
      }
    }
    return name
  }

}
