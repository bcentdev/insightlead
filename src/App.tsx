import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { AuthProvider } from '@/modules/auth/ui/components/auth-provider';
import { ProtectedRoute } from '@/modules/auth/ui/components/protected-route';
import { AuthPage } from '@/modules/auth/ui/pages/auth';
import { Layout } from '@/shared/ui/components/layout';
import { ThemeProvider } from '@/shared/ui/context/theme-context';
import DashboardPage from '@/modules/dashboard/ui/dashboard.tsx';
import PeersPage from '@/modules/peers/ui/pages/peers';
import ObjectivesPage from '@/modules/objectives/ui/pages/objectives';
import TeamsPage from '@/modules/teams/ui/pages/teams';
import SettingsPage from '@/shared/ui/pages/settings';
import GitHubAnalyticsPage from '@/modules/github/ui/pages/github-analytics';
import JiraAnalyticsPage from '@/modules/jira/ui/pages/jira-analytics';

function App() {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<AuthPage />} />
              
              {/* Protected routes with layout */}
              <Route path="/*" element={
                <ProtectedRoute>
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
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}

export default App;