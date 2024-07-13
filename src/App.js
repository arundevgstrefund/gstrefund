// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GstCalculate from './components/GstCalculate';
import UserData from './components/UserData';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<GstCalculate />} />
          <Route path="/userdata" element={<UserData />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
