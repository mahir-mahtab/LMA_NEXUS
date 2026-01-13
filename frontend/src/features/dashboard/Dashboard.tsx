/**
 * Dashboard Page
 * Portfolio Health overview with KPI cards and activity panels
 * Requirements: 5.2, 7.1
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { useToastHelpers } from '../../components/feedback/ToastContainer';
import { StatCard, DashboardSkeleton, EmptyState } from '../../components/ui';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getGraph } from '../../services/graphService';
import { listDrift } from '../../services/driftService';
import { GraphState } from '../../types/graph';
import { DriftItem } from '../../types/drift';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { error: showError } = useToastHelpers();
  const [graphState, setGraphState] = useState<GraphState | null>(null);
  const [driftItems, setDriftItems] = useState<DriftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!activeWorkspaceId) return;

      try {
        setLoading(true);

        // Load graph data for network integrity
        const graphResult = await getGraph(activeWorkspaceId);
        if (graphResult.success && graphResult.graph) {
          setGraphState(graphResult.graph);
        }

        // Load drift data for drift count
        const driftData = await listDrift({ 
          workspaceId: activeWorkspaceId,
          status: 'unresolved'
        });
        setDriftItems(driftData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showError('Failed to load dashboard data', 'Please refresh the page to try again');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [activeWorkspaceId, showError]);

  // Calculate KPI values
  const networkIntegrity = graphState?.integrityScore || 0;
  const unresolvedDriftCount = driftItems.length;
  const highDriftCount = driftItems.filter(d => d.severity === 'HIGH').length;
  
  // Mock values for Active Lenders and Days to Closing
  const activeLenders = 12; // Mock value
  const daysToClosing = 23; // Mock value

  const handleNavigateToGraph = () => {
    navigate(`/app/workspaces/${activeWorkspaceId}/impact-map`);
  };

  const handleNavigateToDrift = () => {
    navigate(`/app/workspaces/${activeWorkspaceId}/commercial-drift`);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500/5 blur-3xl rounded-full -ml-24 -mb-24"></div>

        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <span className="text-white font-bold text-base">L</span>
                </div>
                <span className="text-xs font-bold tracking-wider text-primary-600 uppercase">LMA Nexus</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Portfolio Health
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Key performance indicators and real-time insights for your deal portfolio.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Network Integrity */}
          <StatCard
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Network Integrity"
            value={`${networkIntegrity}%`}
            badge={networkIntegrity >= 90 ? 'Healthy' : networkIntegrity >= 70 ? 'Warning' : 'Critical'}
            badgeVariant="status"
            onClick={handleNavigateToGraph}
            trend={
              networkIntegrity >= 90
                ? { direction: 'up', value: '2.4%' }
                : { direction: 'down', value: '5.1%' }
            }
          />

          {/* Drift Count */}
          <StatCard
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
            label="Drift Count"
            value={unresolvedDriftCount}
            badge={highDriftCount > 0 ? `${highDriftCount} HIGH` : 'Stable'}
            badgeVariant="severity"
            onClick={handleNavigateToDrift}
          />

          {/* Active Lenders */}
          <StatCard
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label="Active Lenders"
            value={activeLenders}
            badge="Committed"
            badgeVariant="status"
          />

          {/* Days to Closing */}
          <StatCard
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Days to Closing"
            value={daysToClosing}
            badge={daysToClosing <= 30 ? 'On Track' : 'Delayed'}
            badgeVariant="status"
            trend={{ direction: 'down', value: '3 days' }}
          />
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Node Distribution Panel */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden" padding="none">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Node Distribution
              </h2>
              <button
                onClick={handleNavigateToGraph}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center"
              >
                View Map
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {[
                { label: 'Financial', color: 'bg-emerald-500', count: graphState?.nodes.filter(n => n.type === 'financial').length || 8, percentage: '40%' },
                { label: 'Covenant', color: 'bg-blue-500', count: graphState?.nodes.filter(n => n.type === 'covenant').length || 6, percentage: '30%' },
                { label: 'Definition', color: 'bg-indigo-500', count: graphState?.nodes.filter(n => n.type === 'definition').length || 4, percentage: '20%' },
                { label: 'Cross-Reference', color: 'bg-amber-500', count: graphState?.nodes.filter(n => n.type === 'xref').length || 2, percentage: '10%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 ${item.color} rounded-full`}></div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                      style={{ width: item.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Nodes</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {graphState?.nodes.length || 20}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Drift Activity Panel */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden" padding="none">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent Drift Activity
              </h2>
              <button
                onClick={handleNavigateToDrift}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center"
              >
                Full Report
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {driftItems.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    }
                    title="No drift detected"
                    description="All values are perfectly aligned with baselines."
                    size="sm"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {driftItems.slice(0, 5).map((drift) => (
                    <div
                      key={drift.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          drift.severity === 'HIGH' ? 'bg-danger-50 text-danger-600' : 
                          drift.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                            {drift.title}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {drift.baselineValue} → <span className="text-slate-900 dark:text-white font-bold">{drift.currentValue}</span>
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="severity" 
                        value={drift.severity} 
                        className="font-bold border-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {driftItems.length > 5 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  + {driftItems.length - 5} More Items
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;