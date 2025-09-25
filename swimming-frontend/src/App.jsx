import React from 'react';
import HomeComponent from './components/HomeComponent';
import AddcompComponent from './components/AddcompComponent';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeComponent />} />
        <Route path="/Add_Competition" element={<AddcompComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
