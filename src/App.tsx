import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Exam from './pages/Exam';
import WrongBook from './pages/WrongBook';
import Stats from './pages/Stats';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/wrong-book" element={<WrongBook />} />
          <Route path="/stats" element={<Stats />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
