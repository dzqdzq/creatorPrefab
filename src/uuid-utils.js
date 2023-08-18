for (
  var t = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    r = new Array(128),
    i = 0;
  i < 128;
  ++i
) {
  r[i] = 0;
}

for (i = 0; i < 64; ++i) {
  r[t.charCodeAt(i)] = i;
}
const n = /-/g,
  s = /^[0-9a-fA-F-]{36}$/,
  o = /^[0-9a-fA-F]{32}$/,
  u = /^[0-9a-zA-Z+/]{22,23}$/,
  a = /.*[/\\][0-9a-fA-F]{2}[/\\]([0-9a-fA-F-]{8,})/;
var c = {
  Reg_UuidInLibPath: a,
  NonUuidMark: '.',
  compressUuid: function (e, t) {
    if (s.test(e)) e = e.replace(n, '');
    else if (!o.test(e)) return e;
    var r = !0 === t ? 2 : 5;
    return c.compressHex(e, r);
  },
  compressHex: function (e, r) {
    var i,
      n = e.length;
    i = void 0 !== r ? r : n % 3;
    for (var s = e.slice(0, i), o = []; i < n; ) {
      var u = parseInt(e[i], 16),
        a = parseInt(e[i + 1], 16),
        c = parseInt(e[i + 2], 16);
      o.push(t[(u << 2) | (a >> 2)]), o.push(t[((3 & a) << 4) | c]), (i += 3);
    }
    return s + o.join('');
  },
  decompressUuid: function (e) {
    if (23 === e.length) {
      let t = [];
      for (let i = 5; i < 23; i += 2) {
        let n = r[e.charCodeAt(i)],
          s = r[e.charCodeAt(i + 1)];
        t.push((n >> 2).toString(16)),
          t.push((((3 & n) << 2) | (s >> 4)).toString(16)),
          t.push((15 & s).toString(16));
      }
      e = e.slice(0, 5) + t.join('');
    } else {
      if (22 !== e.length) return e;
      {
        let t = [];
        for (let i = 2; i < 22; i += 2) {
          let n = r[e.charCodeAt(i)],
            s = r[e.charCodeAt(i + 1)];
          t.push((n >> 2).toString(16)),
            t.push((((3 & n) << 2) | (s >> 4)).toString(16)),
            t.push((15 & s).toString(16));
        }
        e = e.slice(0, 2) + t.join('');
      }
    }
    return [
      e.slice(0, 8),
      e.slice(8, 12),
      e.slice(12, 16),
      e.slice(16, 20),
      e.slice(20),
    ].join('-');
  },
  isUuid: function (e) {
    return u.test(e) || o.test(e) || s.test(e);
  },
  getUuidFromLibPath(e) {
    var t = e.match(a);
    return t ? t[1] : '';
  },
};
export default c;
