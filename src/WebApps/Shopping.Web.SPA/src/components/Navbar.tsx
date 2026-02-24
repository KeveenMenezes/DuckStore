import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Navbar() {
  const { username, logout } = useAuth()

  return (
    <>
      <nav style={styles.nav}>
        <Link to="/" style={styles.brand}>
          🦆 DuckStore
        </Link>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>
            Catalog
          </Link>
          <Link to="/basket" style={styles.link}>
            Basket
          </Link>
          <Link to="/orders" style={styles.link}>
            Orders
          </Link>
        </div>
        <div style={styles.user}>
          <span style={styles.username}>{username}</span>
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>
      <main style={styles.main}>
        <Outlet />
      </main>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1.5rem',
    background: '#1a1a2e',
    color: '#fff',
  },
  brand: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginRight: 'auto',
  },
  links: { display: 'flex', gap: '1rem' },
  link: { color: '#ccc', textDecoration: 'none' },
  user: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' },
  username: { fontSize: '0.9rem', color: '#adf' },
  logoutBtn: {
    cursor: 'pointer',
    background: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.35rem 0.8rem',
    fontSize: '0.85rem',
  },
  main: { padding: '2rem 1.5rem' },
}
