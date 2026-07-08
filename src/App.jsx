// src/App.jsx
import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
// 認証用の関数をインポート
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null); // ログインユーザーの情報を管理
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // 1. ログイン状態の監視（画面を開いた時に自動チェック）
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // ログインしたらデータを取りに行く
        fetchTransactions();
      } else {
        setTransactions([]);
      }
    });
    return () => unsubscribe(); // クリーンアップ
  }, []);

  // 2. Googleログインを実行する関数
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("ログインエラー:", error);
    }
  };

  // 3. ログアウトを実行する関数
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  // 4. データを取得する関数
  const fetchTransactions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "households", "family_a", "transactions"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
    } catch (error) {
      console.error("データ取得エラー:", error);
    }
  };

  // 5. データを追加する関数
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !user) return; // ログインしていない場合は処理しない

    try {
      await addDoc(collection(db, "households", "family_a", "transactions"), {
        type: "expense",
        amount: Number(amount),
        description: description,
        date: serverTimestamp(),
        categoryId: "food",
        createdBy: user.uid // ★動的にログインユーザーのUIDを保存！
      });

      setAmount('');
      setDescription('');
      fetchTransactions();
    } catch (error) {
      console.error("データ追加エラー:", error);
    }
  };

  // --- 画面の表示部分 ---
  // ログインしていない場合はログイン画面を表示
  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>簡易家計簿アプリ</h1>
        <p>ご利用にはログインが必要です（家族限定）</p>
        <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Googleアカウントでログイン
        </button>
      </div>
    );
  }

  // ログインしている場合は家計簿画面を表示
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>簡易家計簿アプリ (Step 2)</h1>
        <div>
          <span>ようこそ、{user.displayName} さん </span>
          <button onClick={handleLogout}>ログアウト</button>
        </div>
      </div>

      {/* データ追加フォーム */}
      <form onSubmit={handleAddTransaction} style={{ marginBottom: '20px', marginTop: '20px' }}>
        <input 
          type="number" 
          placeholder="金額" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="メモ" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />
        <button type="submit">支出を追加</button>
      </form>

      {/* データ一覧表示 */}
      <h2>支出一覧</h2>
      <ul>
        {transactions.map((t) => (
          <li key={t.id}>
            {t.description || 'なし'} : {t.amount}円 (登録者ID: {t.createdBy.substring(0, 5)}...)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;