/* Loads the domain modules in dependency order and re-exports the namespace */
import { MG } from './mg.js';
import './i18n.js';
import './store.js';
import './calc.js';
import './draw.js';
import './auth.js';
import './ledger.js';
import './domain.js';

MG.theme = () => document.documentElement.getAttribute('data-theme') || 'dark';
MG.toggleTheme = function () {
  const th = MG.theme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', th);
  try { localStorage.setItem('mg.theme', th); } catch (e) {}
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.setAttribute('content', th === 'dark' ? '#0c0d10' : '#f5f1e8');
  MG.emit();
};
MG.toggleLang = () => MG.setLang(MG.lang === 'ar' ? 'en' : 'ar');

export { MG };
export const t = k => MG.t(k);
export default MG;
