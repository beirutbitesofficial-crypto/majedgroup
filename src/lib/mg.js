/* Shared domain namespace: pricing, drawings, ledger and data store live here,
   independent of the React UI. Components subscribe to changes via MG.subscribe. */
export const MG = {};

const listeners = new Set();
let version = 0;
MG.subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
MG.getVersion = () => version;
MG.emit = () => { version++; listeners.forEach(fn => fn()); };
MG.toast = () => {};
