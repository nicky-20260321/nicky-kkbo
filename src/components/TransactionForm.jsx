import { useState, useEffect, useRef } from 'react';

const CATEGORY_OPTIONS = {
  expense: [
    { value: 'food', label: '食費' },
    { value: 'shopping', label: '日用品・買い物' },
    { value: 'entertainment', label: '交際費' },
    { value: 'transport', label: '交通費' },
    { value: 'utilities', label: '住居・光熱費' },
    { value: 'other', label: 'その他' }
  ],
  income: [
    { value: 'salary', label: '給与' },
    { value: 'bonus', label: '賞与' },
    { value: 'allowance', label: 'お小遣い' },
    { value: 'other', label: 'その他' }
  ]
};

function TransactionForm({ isOpen, onClose, onSave, editTransaction, currentUser }) {
  const dialogRef = useRef(null);
  
  // Format edit transaction date to YYYY-MM-DD
  const getInitialDate = () => {
    if (editTransaction?.date) {
      const d = editTransaction.date.seconds 
        ? new Date(editTransaction.date.seconds * 1000) 
        : new Date(editTransaction.date);
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  // Form fields state (re-initialized when component mounts/re-mounts using key)
  const [type, setType] = useState(editTransaction?.type || 'expense');
  const [amount, setAmount] = useState(editTransaction?.amount || '');
  const [date, setDate] = useState(getInitialDate());
  const [category, setCategory] = useState(editTransaction?.category || 'food');
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [createdByName, setCreatedByName] = useState(
    editTransaction?.createdByName || editTransaction?.createdBy || (currentUser ? (currentUser.displayName || '自分') : '')
  );

  // Handle opening and closing native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Adjust category if type changes
  const handleTypeChange = (newType) => {
    setType(newType);
    const options = CATEGORY_OPTIONS[newType];
    setCategory(options[0].value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !date || !category) return;

    const data = {
      type,
      amount: Number(amount),
      date: new Date(date),
      category,
      description,
      createdByName,
      createdBy: currentUser ? currentUser.uid : 'anonymous'
    };

    if (editTransaction) {
      data.id = editTransaction.id;
    }

    onSave(data);
    onClose();
  };

  // Close modal when clicking on the backdrop
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog ref={dialogRef} onClick={handleBackdropClick} style={styles.dialog}>
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          
          {/* Header */}
          <div className="modal-header flex-between">
            <h2 style={styles.title}>
              {editTransaction ? '取引を編集' : '取引を追加'}
            </h2>
            <button 
              type="button" 
              className="btn btn-secondary btn-icon" 
              style={styles.closeBtn}
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Income/Expense Toggle */}
            <div className="toggle-group">
              <div className="toggle-option">
                <input
                  type="radio"
                  id="type-expense"
                  name="type"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={() => handleTypeChange('expense')}
                />
                <label htmlFor="type-expense" className="toggle-label">支出</label>
              </div>
              <div className="toggle-option">
                <input
                  type="radio"
                  id="type-income"
                  name="type"
                  value="income"
                  checked={type === 'income'}
                  onChange={() => handleTypeChange('income')}
                />
                <label htmlFor="type-income" className="toggle-label">収入</label>
              </div>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label htmlFor="amount">金額 (円) *</label>
              <input
                type="number"
                id="amount"
                className="input-control"
                placeholder="金額を入力してください (例: 1200)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
              />
              <span className="error-msg">※ 1円以上の有効な金額を入力してください。</span>
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="date">日付 *</label>
              <input
                type="date"
                id="date"
                className="input-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <span className="error-msg">※ 日付を選択してください。</span>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category">カテゴリ *</label>
              <select
                id="category"
                className="input-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORY_OPTIONS[type].map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Memo */}
            <div className="form-group">
              <label htmlFor="description">メモ</label>
              <input
                type="text"
                id="description"
                className="input-control"
                placeholder="品名や詳細メモ (例: スーパーで買い出し)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Paid By (Created By Name) */}
            <div className="form-group">
              <label htmlFor="createdByName">支払者 / 登録者</label>
              <input
                type="text"
                id="createdByName"
                className="input-control"
                placeholder="誰の支払い・登録か (例: パパ、ママ)"
                value={createdByName}
                onChange={(e) => setCreatedByName(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              キャンセル
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {editTransaction ? '更新する' : '追加する'}
            </button>
          </div>

        </form>
      </div>
    </dialog>
  );
}

const styles = {
  dialog: {
    padding: 0,
    background: 'none',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    padding: 0,
    fontSize: '0.85rem',
  }
};

export default TransactionForm;
