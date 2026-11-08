/* calc_worker.js — 后台做情景抽样，避免阻塞界面；返回原始抽样供门槛滑杆即时重算 */
importScripts("engine.js");
self.onmessage = function (ev) {
  var q = ev.data; // {sid,n,shockStd,seed}
  try {
    var r = Engine.runMonteCarlo(q.sid, q.n, q.shockStd, q.seed, function (done, total) {
      if (done % 500 === 0 || done === total) {
        self.postMessage({type:"progress", done:done, total:total});
      }
    });
    self.postMessage({type:"done", result:r});
  } catch (e) {
    self.postMessage({type:"error", message:String(e && e.message || e)});
  }
};
