import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

function Login({ error, onErrorClear }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    if (onErrorClear) onErrorClear();
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>🏠</div>
          <h1 style={styles.title}>家族の家計簿</h1>
          <p style={styles.subtitle}>Family Account Book</p>
        </div>

        {error ? (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>アクセス制限</h2>
            <p style={styles.errorMessage}>
              ログインしたアカウントは、この家計簿の利用許可リスト（ホワイトリスト）に登録されていません。
            </p>
            <p style={styles.errorSubMessage}>
              別のGoogleアカウントでお試しいただくか、管理者へお問い合わせください。
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : '別のアカウントでログイン'}
            </button>
            <button
              className="btn"
              style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', width: '100%', background: 'transparent' }}
              onClick={() => auth.signOut()}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div style={styles.actionContainer}>
            <p style={styles.description}>
              このアプリは家族専用の家計簿です。<br />
              ご利用には、登録済みのGoogleアカウントでのログインが必要です。
            </p>

            <button
              id="google-login-btn"
              className="btn btn-primary"
              style={styles.loginBtn}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <svg style={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="#currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google アカウントでログイン</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1.5rem',
  },
  card: {
    maxWidth: '420px',
    width: '100%',
    padding: '2.5rem 2rem',
    textAlign: 'center',
  },
  header: {
    marginBottom: '2rem',
  },
  logoIcon: {
    fontSize: '3.5rem',
    marginBottom: '0.5rem',
    filter: 'drop-shadow(0 4px 12px var(--color-primary-glow))',
    animation: 'modal-scale-in 0.6s ease',
  },
  title: {
    fontSize: '1.75rem',
    color: 'var(--text-main)',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '0.25rem',
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  description: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '2rem',
  },
  loginBtn: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    backgroundColor: '#fff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  googleIcon: {
    flexShrink: 0,
    fill: '#4285F4', /* Google Blue */
  },
  errorContainer: {
    textAlign: 'center',
    animation: 'modal-scale-in 0.3s ease',
  },
  errorIcon: {
    fontSize: '3rem',
    color: 'var(--color-warning)',
    marginBottom: '1rem',
  },
  errorTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-main)',
    fontWeight: '600',
    marginBottom: '0.75rem',
  },
  errorMessage: {
    color: '#fda4af', /* soft red */
    fontSize: '0.95rem',
    lineHeight: '1.5',
    marginBottom: '0.75rem',
  },
  errorSubMessage: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    marginBottom: '1.5rem',
  }
};

export default Login;
