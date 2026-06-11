import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './renderer/components/ui/Layout';
import { Dashboard } from './renderer/pages/Dashboard';
import { NewReservation } from './renderer/pages/NewReservation';
import { Resources } from './renderer/pages/Resources';
import { NewResource } from './renderer/pages/NewResource';
import { Permissions } from './renderer/pages/Permissions';
import { Export } from './renderer/pages/Export';
import { ReservationProvider } from './renderer/contexts/ReservationContext';

function App() {
  return (
    <ReservationProvider>
      <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/new" element={<NewResource />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/export" element={<Export />} />
        </Routes>
      </Layout>
    </Router>
    </ReservationProvider>
  );
}

export default App;
