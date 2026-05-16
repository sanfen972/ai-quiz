import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          首页
        </NavLink>
        <NavLink to="/practice" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          练习模式
        </NavLink>
        <NavLink to="/exam" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          考试模式
        </NavLink>
        <NavLink to="/wrong-book" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          错题本
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          统计
        </NavLink>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
