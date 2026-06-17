import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Users, 
  Mail, 
  UserPlus, 
  Crown, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Plus,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { teamService } from '../../services/api';
import { TeamTasksModal } from '../../components/TeamTasks/TeamTasksModal';

interface Team {
  id: number;
  name: string;
  description: string;
  role: string;
  created_at: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  profile_photo?: string;
}

interface ApiError {
  message: string;
}

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showTasksModal, setShowTasksModal] = useState<boolean>(false);
  const [selectedTeamForTasks, setSelectedTeamForTasks] = useState<{ id: number; name: string; role: string } | null>(null);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamDesc, setNewTeamDesc] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchTeamDetails = useCallback(async (teamId: number): Promise<void> => {
    try {
      const response = await teamService.getTeamDetails(teamId);
      setTeamMembers(response?.members || []);
      setUserRole(response?.user_role || '');
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching team details:', apiError);
    }
  }, []);

  const fetchTeams = useCallback(async (): Promise<void> => {
    try {
      const response = await teamService.getMyTeams();
      const teamsData: Team[] = response?.teams || [];
      setTeams(teamsData);
      if (teamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsData[0]);
        await fetchTeamDetails(teamsData[0].id);
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching teams:', apiError);
      setError(apiError.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, fetchTeamDetails]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async (): Promise<void> => {
      if (isMounted) {
        await fetchTeams();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchTeams]);

  const handleCreateTeam = async (): Promise<void> => {
    if (!newTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    setCreateLoading(true);
    setError('');

    try {
      await teamService.createTeam({
        name: newTeamName,
        description: newTeamDesc,
      });
      setSuccess('Team created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDesc('');
      await fetchTeams();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInviteMember = async (): Promise<void> => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setInviteLoading(true);
    setError('');

    try {
      await teamService.inviteMember(selectedTeam!.id, inviteEmail, inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setTimeout(() => setSuccess(''), 3000);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      await fetchTeamDetails(selectedTeam!.id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string): Promise<void> => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await teamService.removeMember(selectedTeam!.id, memberId);
        setSuccess('Member removed successfully');
        setTimeout(() => setSuccess(''), 3000);
        await fetchTeamDetails(selectedTeam!.id);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to remove member');
      }
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string): Promise<void> => {
    try {
      await teamService.updateMemberRole(selectedTeam!.id, memberId, newRole);
      setSuccess('Member role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchTeamDetails(selectedTeam!.id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update role');
    }
  };

  const handleViewTasks = (): void => {
    if (selectedTeam) {
      setSelectedTeamForTasks({
        id: selectedTeam.id,
        name: selectedTeam.name,
        role: userRole
      });
      setShowTasksModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading teams...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Teams</h1>
              <p className="text-gray-500 mt-1">Manage your teams and collaborate with members</p>
            </div>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="p-4 lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Teams</h2>
              <div className="space-y-2">
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No teams yet</p>
                    <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="mt-2">
                      Create your first team
                    </Button>
                  </div>
                ) : (
                  teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team);
                        fetchTeamDetails(team.id);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                        selectedTeam?.id === team.id
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{team.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {team.role === 'admin' ? 'Admin' : 'Member'}
                          </p>
                        </div>
                        {team.role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {selectedTeam ? (
              <Card className="p-6 lg:col-span-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{selectedTeam.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedTeam.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleViewTasks}>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      View Tasks
                    </Button>
                    {userRole === 'admin' && (
                      <Button variant="secondary" size="sm" onClick={() => setShowInviteModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Team Members ({teamMembers.length})
                  </h3>
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.profile_photo ? (
                              <img src={`http://localhost:8080/${member.profile_photo}`} alt={member.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              member.name?.charAt(0) || 'U'
                            )}
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
                              {member.email === currentUser.email && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {userRole === 'admin' && member.email !== currentUser.email && (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 lg:col-span-3 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a team to view details</p>
                {teams.length === 0 && (
                  <Button variant="primary" onClick={() => setShowCreateModal(true)} className="mt-4">
                    Create Your First Team
                  </Button>
                )}
              </Card>
            )}
          </div>

          {showCreateModal && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateModal(false)} />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Create New Team</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter team name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newTeamDesc}
                      onChange={(e) => setNewTeamDesc(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Describe what this team does"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" disabled={createLoading}>
                      {createLoading ? 'Creating...' : 'Create Team'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}

          {showInviteModal && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowInviteModal(false)} />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Invite Team Member</h3>
                  <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleInviteMember(); }} className="space-y-4">
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
                    <p className="text-xs text-gray-400 mt-1">
                      If user doesn't exist, they'll be invited to join TaskFlow
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="member">Member (Can view team)</option>
                      <option value="admin">Admin (Can manage team)</option>
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

          {showTasksModal && selectedTeamForTasks && (
            <TeamTasksModal
              teamId={selectedTeamForTasks.id}
              teamName={selectedTeamForTasks.name}
              userRole={selectedTeamForTasks.role}
              onClose={() => {
                setShowTasksModal(false);
                setSelectedTeamForTasks(null);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};