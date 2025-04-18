// src/Routes.jsx
import React from 'react';
import EvaluationTool from './EvaluationTool/EvaluationTool';
import { Routes, Route } from 'react-router-dom';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<EvaluationTool />} />
    </Routes>
  );
};

export default AppRoutes;
