/* One-tap entry tiles: receipts, everyday expenses, wages, purchases, treasury */
import { MG, t } from '../lib/index.js';
import { Icon, Modal } from '../components/ui.jsx';
import { openPayment, openExpense, openWage, openAdvance, openSupplierPay, openTransfer, openEquity } from './money.jsx';
import { openProjectForm } from './ProjectForm.jsx';

export function QuickTiles({ compact, onPick }) {
  const tiles = [];
  const salaryQuick = MG.can('expenses') && MG.getCategory('salary').quick;
  if (MG.can('payments.receive')) tiles.push(['pay', 'cash', t('qReceive'), 'gold']);
  if (MG.can('expenses')) MG.db.settings.categories.filter(c => c.quick).forEach(c => tiles.push(['exp:' + c.id, c.icon || 'wallet', MG.nm(c.name)]));
  if (MG.can('workers') && !salaryQuick) tiles.push(['wage', 'hardhat', t('payWage')]);
  if (!compact) {
    if (MG.can('workers')) tiles.push(['adv', 'coins', t('giveAdvance')]);
    if (MG.can('suppliers')) { tiles.push(['purchase', 'box', t('recordPurchase')]); tiles.push(['suppay', 'truck', t('paySupplier')]); }
    if (MG.can('expenses')) tiles.push(['exp:', 'wallet', t('otherExpense')]);
    if (MG.can('accounting')) { tiles.push(['transfer', 'swap', t('transfer2')]); tiles.push(['drawing', 'user', t('eq_drawing')]); tiles.push(['capital', 'bank', t('eq_capital')]); }
    if (MG.can('projects.edit')) tiles.push(['project', 'folder', t('newProject')]);
  }
  const pick = q => {
    onPick && onPick();
    if (q === 'pay') openPayment({});
    else if (q === 'wage') openWage({});
    else if (q === 'adv') openAdvance({});
    else if (q === 'purchase') openExpense({ category: 'material', paid: false });
    else if (q === 'suppay') openSupplierPay({});
    else if (q === 'transfer') openTransfer();
    else if (q === 'drawing' || q === 'capital') openEquity(q);
    else if (q === 'project') openProjectForm();
    else if (q.startsWith('exp:')) {
      const cat = q.slice(4);
      if (cat === 'salary' && MG.can('workers') && MG.workerOpts().length) openWage({});
      else openExpense(cat ? { category: cat } : {});
    }
  };
  return <div className={'qtiles' + (compact ? ' compact' : '')}>{tiles.map(x =>
    <button key={x[0]} className={'qtile ' + (x[3] || '')} onClick={() => pick(x[0])}><Icon name={x[1]} /><span>{x[2]}</span></button>)}</div>;
}

export default function QuickAdd({ close }) {
  return <Modal title={t('quickEntry')} onClose={close}><QuickTiles onPick={close} /></Modal>;
}
