import React, { useState } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Users, Mail, UserPlus, Crown, AlertCircle } from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // This would come from your backend API
  const [teamStats] = useState({
    totalMembers: 1,
    activeTasks: 0,
    completionRate: 0
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // This would be fetched from your backend
  const teamMembers = [
    {
      id: currentUser.id || 1,
      name: currentUser.name || 'You',
      email: currentUser.email || 'your@email.com',
      role: 'admin',
      avatar: currentUser.name?.charAt(0) || 'U'
    }
  ];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      setInviteError('Please enter an email address');
      return;
    }
    
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');
    
    // This would call your backend API
    try {
      // Simulate API call - Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteSuccess('');
      }, 2000);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Teams</h1>
              <p className="text-gray-500 mt-1">Manage your team members and collaborations</p>
            </div>
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Team Members</p>
                  <p className="text-2xl font-bold text-gray-800">{teamStats.totalMembers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Team Tasks</p>
                  <p className="text-2xl font-bold text-gray-800">{teamStats.activeTasks}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-800">{teamStats.completionRate}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">{member.name}</p>
                        {member.role === 'admin' && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Invite Modal */}
          {showInviteModal && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowInviteModal(false)} />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Invite Team Member</h3>
                
                {inviteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{inviteError}</p>
                  </div>
                )}
                
                {inviteSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-600">{inviteSuccess}</p>
                  </div>
                )}
                
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="colleague@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" disabled={inviteLoading}>
                      {inviteLoading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowInviteModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};