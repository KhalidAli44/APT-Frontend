import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Signup from './pages/signup/signup';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';

function App() {
  return (
    <Router>
      <div className="App">
        <div className="content">
          <Routes>
            <Route exact path="/Signup" element={<Signup />}/>
            <Route exact path="/Login" element={<Login />}/>
            <Route exact path="/Home" element={<Home />}/>
            <Route path="*" element={<Navigate to="/Login" />} />
          </Routes>
        </div>
        
      </div>
    </Router>
  );
}

export default App;