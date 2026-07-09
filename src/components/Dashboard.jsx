
function Dashboard({ transactions }) {
  // Calculate summaries
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const balance = income - expense;

  return (
    <div className="grid-cols-3" style={styles.grid}>
      {/* Balance Card */}
      <div className="glass-panel" style={{ ...styles.card, ...styles.cardBalance }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardLabel}>当月残高</span>
          <span style={styles.cardIcon}>💰</span>
        </div>
        <div style={styles.cardValue}>
          {balance >= 0 ? '+' : ''}{balance.toLocaleString()}円
        </div>
        <div style={styles.cardFooter}>
          収支の合計バランス
        </div>
      </div>

      {/* Income Card */}
      <div className="glass-panel" style={{ ...styles.card, ...styles.cardIncome }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardLabel}>総収入</span>
          <span style={styles.cardIcon}>📈</span>
        </div>
        <div style={styles.cardValue}>
          {income.toLocaleString()}円
        </div>
        <div style={styles.cardFooter}>
          登録された収入の合計
        </div>
      </div>

      {/* Expense Card */}
      <div className="glass-panel" style={{ ...styles.card, ...styles.cardExpense }}>
        <div style={styles.cardHeader}>
          <span style={styles.cardLabel}>総支出</span>
          <span style={styles.cardIcon}>📉</span>
        </div>
        <div style={styles.cardValue}>
          {expense.toLocaleString()}円
        </div>
        <div style={styles.cardFooter}>
          登録された支出の合計
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    marginBottom: '2rem',
  },
  card: {
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  cardBalance: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
  },
  cardIncome: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
  },
  cardExpense: {
    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(225, 29, 72, 0.15) 100%)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    boxShadow: '0 8px 24px rgba(244, 63, 94, 0.15)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  cardLabel: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--text-muted)',
  },
  cardIcon: {
    fontSize: '1.25rem',
  },
  cardValue: {
    fontSize: '1.85rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: 'var(--text-main)',
    marginBottom: '0.5rem',
  },
  cardFooter: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  }
};

export default Dashboard;
