import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { Layout } from './presentation/components/common/layout';
import { ThemeProvider } from './presentation/context/theme-context';
import DashboardPage from './modules/dashboard/ui/dashboard.tsx';
import PeersPage from './presentation/pages/peers';
import ObjectivesPage from './presentation/pages/objectives';
import TeamsPage from './presentation/pages/teams';
import SettingsPage from './presentation/pages/settings';
import GitHubAnalyticsPage from './presentation/pages/github-analytics';
import JiraAnalyticsPage from './presentation/pages/jira-analytics';

function App() {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/peers" element={<PeersPage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/github" element={<GitHubAnalyticsPage />} />
              <Route path="/jira" element={<JiraAnalyticsPage />} />
            </Routes>
          </Layout>
        </Router>
      </HeroUIProvider>
    </ThemeProvider>
  );
}

export default App;