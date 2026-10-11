import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">BulkMail</span>
        <nav>
          <NavLink to="/" end>Compose</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
        <div className="navbar-user">
          <span>{username}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
