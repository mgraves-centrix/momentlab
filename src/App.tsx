import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { ScreeningConsentPage } from './pages/ScreeningConsent';
import { ResponseTimelinePage } from './pages/ResponseTimelinePage';
import { MomentEvidencePage } from './pages/MomentEvidencePage';
import { EditHypothesisPage } from './pages/EditHypothesisPage';
import { CreateAbTestPage } from './pages/CreateAbTestPage';
import { ExperimentResultsPage } from './pages/ExperimentResultsPage';
import { MobileMorePage } from './pages/MobileMorePage';
import { AdminDemoPage } from './pages/AdminDemoPage';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
        {/* Project & Screening Routes */}
        <Route path="/projects" element={<ProjectsDashboard />} />
        <Route path="/screen/:screeningToken" element={<ScreeningConsentPage />} />

        {/* Experiment Canonical Routes */}
        <Route
          path="/projects/:projectId/experiments/:experimentId/finding"
          element={<ResponseTimelinePage />}
        />
        <Route
          path="/projects/:projectId/experiments/:experimentId/evidence"
          element={<MomentEvidencePage />}
        />
        <Route
          path="/projects/:projectId/experiments/:experimentId/hypothesis"
          element={<EditHypothesisPage />}
        />
        <Route
          path="/projects/:projectId/experiments/:experimentId/test"
          element={<CreateAbTestPage />}
        />
        <Route
          path="/projects/:projectId/experiments/:experimentId/results"
          element={<ExperimentResultsPage />}
        />
        <Route
          path="/projects/:projectId/experiments/:experimentId/more"
          element={<MobileMorePage />}
        />

        {/* Experiment Base URL Redirect to /finding */}
        <Route
          path="/projects/:projectId/experiments/:experimentId"
          element={<Navigate to="finding" replace />}
        />

        {/* Admin Demo Controls */}
        <Route path="/admin/demo" element={<AdminDemoPage />} />

        {/* Root Redirect to /projects */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
