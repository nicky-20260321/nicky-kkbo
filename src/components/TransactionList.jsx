
const CATEGORY_LABELS = {
  food: '食費',
  shopping: '日用品・買い物',
  entertainment: '交際費',
  transport: '交通費',
  utilities: '住居・光熱費',
  salary: '給与',
  bonus: '賞与',
  allowance: 'お小遣い',
  other: 'その他'
};

function TransactionList({ 
  transactions, 
  currentYear, 
  currentMonth, 
  onMonthChange, 
  onEdit, 
  onDelete 
}) {

  // Group transactions by date
  const groupedTransactions = (() => {
    const groups = {};
    transactions.forEach(t => {
      if (!t.date) return;
      
      const dateObj = t.date.seconds ? new Date(t.date.seconds * 1000) : new Date(t.date);
      const dateKey = dateObj.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a)) // Descending order (newest date first)
      .map(dateStr => {
        const items = groups[dateStr].sort((x, y) => {
          const timeX = x.createdAt?.seconds || 0;
          const timeY = y.createdAt?.seconds || 0;
          return timeY - timeX; // Newest entry within the same day first
        });
        
        // Calculate daily sums
        let dailyIncome = 0;
        let dailyExpense = 0;
        items.forEach(i => {
          if (i.type === 'income') {
            dailyIncome += Number(i.amount);
          } else {
            dailyExpense += Number(i.amount);
          }
        });

        return {
          dateStr,
          items,
          dailyIncome,
          dailyExpense
        };
      });
  })();

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(currentYear - 1, 12);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(currentYear + 1, 1);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    onMonthChange(today.getFullYear(), today.getMonth() + 1);
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 (${dayOfWeek})`;
  };

  const handleDeleteClick = (id, description, amount) => {
    const name = description || 'メモなし';
    if (window.confirm(`「${name}: ${amount}円」の履歴を削除してもよろしいですか？`)) {
      onDelete(id);
    }
  };

  return (
    <div style={styles.container}>
      {/* Month Navigation */}
      <div className="glass-panel flex-between" style={styles.navPanel}>
        <button className="btn btn-secondary" onClick={handlePrevMonth} style={styles.navBtn}>
          ◀ 前月
        </button>
        <div style={styles.monthDisplay}>
          <span style={styles.yearText}>{currentYear}年</span>
          <span style={styles.monthText}>{currentMonth}月</span>
        </div>
        <div style={styles.navRightGroup}>
          <button className="btn btn-secondary" onClick={handleCurrentMonth} style={styles.todayBtn}>
            今月
          </button>
          <button className="btn btn-secondary" onClick={handleNextMonth} style={styles.navBtn}>
            翌月 ▶
          </button>
        </div>
      </div>

      {/* Transactions Timeline */}
      <div style={styles.timeline}>
        <h2 style={styles.timelineTitle}>取引履歴</h2>
        
        {groupedTransactions.length === 0 ? (
          <div className="glass-panel" style={styles.emptyState}>
            <span>📝</span>
            <p>この月の取引データは登録されていません</p>
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.dateStr} style={styles.dateGroup}>
              
              {/* Date Header & Daily Subtotal */}
              <div style={styles.dateHeader}>
                <span style={styles.dateLabel}>{formatDateLabel(group.dateStr)}</span>
                <div style={styles.dateSubtotal}>
                  {group.dailyIncome > 0 && (
                    <span className="text-income" style={styles.subtotalText}>
                      +¥{group.dailyIncome.toLocaleString()}
                    </span>
                  )}
                  {group.dailyExpense > 0 && (
                    <span className="text-expense" style={styles.subtotalText}>
                      -¥{group.dailyExpense.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions List within the day */}
              <div style={styles.itemsList}>
                {group.items.map(item => (
                  <div key={item.id} className="glass-panel glass-panel-interactive" style={styles.itemRow}>
                    
                    {/* Badge & Category */}
                    <div style={styles.itemMeta}>
                      <span className={`badge ${item.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {item.type === 'income' ? '収入' : '支出'}
                      </span>
                      <span style={styles.categoryName}>
                        {CATEGORY_LABELS[item.category] || item.category || 'その他'}
                      </span>
                    </div>

                    {/* Memo & Paid By */}
                    <div style={styles.itemDetails}>
                      <span style={styles.description}>
                        {item.description || <span style={styles.noDescription}>メモなし</span>}
                      </span>
                      <span style={styles.createdBy}>
                        👤 {item.createdByName || '家族'}
                      </span>
                    </div>

                    {/* Amount & Actions */}
                    <div style={styles.itemActionArea}>
                      <span className={item.type === 'income' ? 'text-income' : 'text-expense'} style={styles.amountText}>
                        {item.type === 'income' ? '+' : '-'}{Number(item.amount).toLocaleString()}円
                      </span>
                      
                      <div style={styles.actions}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={styles.actionBtn}
                          onClick={() => onEdit(item)}
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={{ ...styles.actionBtn, color: 'var(--color-expense)' }}
                          onClick={() => handleDeleteClick(item.id, item.description, item.amount)}
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  navPanel: {
    padding: '0.75rem 1.25rem',
  },
  navBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
  },
  monthDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: '1',
  },
  monthText: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    lineHeight: '1.2',
  },
  navRightGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  todayBtn: {
    padding: '0.5rem 0.85rem',
    fontSize: '0.9rem',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  timelineTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-main)',
    marginBottom: '0.25rem',
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: '0.95rem',
  },
  dateGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  dateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 0.5rem',
  },
  dateLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  dateSubtotal: {
    display: 'flex',
    gap: '0.75rem',
  },
  subtotalText: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    minWidth: '120px',
  },
  categoryName: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--text-main)',
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: '150px',
  },
  description: {
    fontSize: '0.95rem',
    color: 'var(--text-main)',
  },
  noDescription: {
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
    fontSize: '0.85rem',
  },
  createdBy: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  itemActionArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginLeft: 'auto',
  },
  amountText: {
    fontSize: '1.05rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: '0.375rem',
  },
  actionBtn: {
    width: '28px',
    height: '28px',
    padding: 0,
    fontSize: '0.75rem',
  }
};

export default TransactionList;
