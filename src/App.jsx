import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Import Custom Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Charts from './components/Charts';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [whitelistError, setWhitelistError] = useState(false);
  
  // Date State (default to current year and month)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);

  // 1. Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setTransactions([]);
        setWhitelistError(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Sync (scoped to currentMonth and currentYear)
  useEffect(() => {
    if (!user) return;

    // Calculate boundary dates for query
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 1); // 1st of next month

    const q = query(
      collection(db, "households", "family_a", "transactions"),
      where("date", ">=", Timestamp.fromDate(startOfMonth)),
      where("date", "<", Timestamp.fromDate(endOfMonth)),
      orderBy("date", "desc")
    );

    // Setup real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
      setWhitelistError(false); // Clear error if successfully fetched
    }, (error) => {
      console.error("Firestore database fetch error:", error);
      // If user is authenticated but Firestore security rules block read:
      if (error.code === 'permission-denied') {
        setWhitelistError(true);
      }
    });

    return () => unsubscribe();
  }, [user, currentYear, currentMonth]);

  // 3. Database CRUD Actions
  const handleSaveTransaction = async (formData) => {
    try {
      const transactionData = {
        type: formData.type,
        amount: formData.amount,
        category: formData.category,
        description: formData.description,
        date: Timestamp.fromDate(formData.date),
        createdBy: formData.createdBy,
        createdByName: formData.createdByName,
      };

      if (formData.id) {
        // Edit mode: Update existing document
        const docRef = doc(db, "households", "family_a", "transactions", formData.id);
        await updateDoc(docRef, transactionData);
      } else {
        // Add mode: Create new document
        transactionData.createdAt = serverTimestamp();
        await addDoc(collection(db, "households", "family_a", "transactions"), transactionData);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      if (error.code === 'permission-denied') {
        setWhitelistError(true);
      } else {
        alert("データの保存中にエラーが発生しました。");
      }
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const docRef = doc(db, "households", "family_a", "transactions", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      if (error.code === 'permission-denied') {
        setWhitelistError(true);
      } else {
        alert("データの削除中にエラーが発生しました。");
      }
    }
  };

  // Month navigation changer callback
  const handleMonthChange = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  const handleOpenAddForm = () => {
    setEditTransaction(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (transaction) => {
    setEditTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Authentication status loading indicator
  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>認証状態を確認中...</p>
      </div>
    );
  }

  // Render Login page if not logged in or unauthorized email
  if (!user || whitelistError) {
    return (
      <Login 
        error={whitelistError} 
        onErrorClear={() => setWhitelistError(false)} 
      />
    );
  }

  // Render Dashboard / Main Application
  return (
    <div className="container">
      
      {/* App Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.headerBrand}>
          <span style={styles.logoIcon}>🏠</span>
          <div>
            <h1 style={styles.headerTitle}>家族の家計簿</h1>
            <p style={styles.headerSubtitle}>family account book</p>
          </div>
        </div>

        <div style={styles.headerUserArea}>
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              style={styles.userAvatar} 
            />
          )}
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.displayName || 'ユーザー'} さん</span>
            <button 
              className="btn" 
              style={styles.logoutBtn} 
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
          <button 
            className="btn btn-primary" 
            style={styles.addBtn}
            onClick={handleOpenAddForm}
          >
            <span>+</span> 取引を追加
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <Dashboard transactions={transactions} />

      {/* SVG Graphs & Visual Analysis */}
      <Charts 
        transactions={transactions} 
        currentYear={currentYear} 
        currentMonth={currentMonth} 
      />

      {/* Transactions History Logs */}
      <TransactionList 
        transactions={transactions}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onEdit={handleOpenEditForm}
        onDelete={handleDeleteTransaction}
      />

      {/* Floating Add Button for Mobile Viewports */}
      <button 
        className="btn btn-primary" 
        style={styles.floatingBtn}
        onClick={handleOpenAddForm}
        title="取引を追加"
      >
        +
      </button>

      {/* Modal Transaction Form */}
      <TransactionForm 
        key={isFormOpen ? (editTransaction ? editTransaction.id : 'new') : 'closed'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveTransaction}
        editTransaction={editTransaction}
        currentUser={user}
      />

    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  header: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  headerTitle: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    lineHeight: '1.2',
  },
  headerSubtitle: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  headerUserArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.15rem',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  logoutBtn: {
    padding: '0.2rem 0.5rem',
    fontSize: '0.75rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  addBtn: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.95rem',
  },
  floatingBtn: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    fontSize: '1.75rem',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
    zIndex: 99,
    display: 'none', // Hidden on desktop, shown on mobile via CSS or media query.
    alignItems: 'center',
    justifyContent: 'center',
  }
};

// Handle showing floating action button dynamically in responsive layouts.
// We can append custom responsive layout logic or styling.
// Add media query rule support inside index.css for .floating-btn visibility.

export default App;