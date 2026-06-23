// src/pages/Teams/page.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
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
  CheckSquare,
  Zap,
  Shield,
  User,
  Calendar,
  Edit2
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
  
  // States for edit and delete
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editTeamName, setEditTeamName] = useState<string>('');
  const [editTeamDesc, setEditTeamDesc] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

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

  // Edit team handlers
  const handleEditTeam = (): void => {
    if (selectedTeam) {
      setEditTeamName(selectedTeam.name);
      setEditTeamDesc(selectedTeam.description || '');
      setShowEditModal(true);
    }
  };

  const handleUpdateTeam = async (): Promise<void> => {
    if (!editTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    setEditLoading(true);
    setError('');

    try {
      await teamService.updateTeam(selectedTeam!.id, {
        name: editTeamName,
        description: editTeamDesc,
      });
      setSuccess('Team updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setShowEditModal(false);
      
      // Update the selected team in state
      if (selectedTeam) {
        setSelectedTeam({
          ...selectedTeam,
          name: editTeamName,
          description: editTeamDesc
        });
      }
      
      await fetchTeams();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update team');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeam = async (): Promise<void> => {
    if (!selectedTeam) return;
    
    if (window.confirm(`Are you sure you want to permanently delete "${selectedTeam.name}"? This action cannot be undone.`)) {
      setDeleteLoading(true);
      setError('');

      try {
        await teamService.deleteTeam(selectedTeam.id);
        setSuccess('Team deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Remove team from list and select another team
        const updatedTeams = teams.filter(t => t.id !== selectedTeam.id);
        setTeams(updatedTeams);
        
        if (updatedTeams.length > 0) {
          setSelectedTeam(updatedTeams[0]);
          await fetchTeamDetails(updatedTeams[0].id);
        } else {
          setSelectedTeam(null);
          setTeamMembers([]);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to delete team');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 blur-2xl animate-pulse"></div>
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
                <p className="text-purple-400 font-mono tracking-wider animate-pulse">LOADING TEAMS...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,#ff00ff11,transparent_60%),radial-gradient(circle_at_70%_80%,#00ffff11,transparent_60%),radial-gradient(circle_at_50%_50%,#000000,#0a0a0a)]"></div>
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
      
      <Sidebar />
      <div className="lg:pl-72 relative z-10">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Header with glitch effect */}
          <div className="mb-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter relative glitch-wrapper">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x relative z-10">
                    TEAMS
                  </span>
                  <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
                </h1>
                <p className="text-gray-400 mt-1 font-mono tracking-wider text-sm">
                  <Zap className="w-4 h-4 inline mr-2 text-purple-400" />
                  MANAGE YOUR TEAMS AND COLLABORATE WITH MEMBERS
                </p>
              </div>
              <Button variant="primary" onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transform hover:scale-105 transition-all duration-300 font-mono">
                <Plus className="w-4 h-4 mr-2" />
                CREATE TEAM
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-3 animate-shake backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
              <p className="text-sm text-red-300 font-mono flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-950/50 border border-green-500/30 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 animate-pulse" />
              <p className="text-sm text-green-300 font-mono flex-1">{success}</p>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Teams List */}
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 lg:col-span-1 shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
              <div className="relative">
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-mono tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  YOUR TEAMS
                </h2>
                <div className="space-y-2">
                  {teams.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10">
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-400 font-mono">NO TEAMS FOUND</p>
                      <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="mt-3 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        DEPLOY FIRST TEAM
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
                        className={`w-full text-left p-3 rounded-xl transition-all duration-300 group ${
                          selectedTeam?.id === team.id
                            ? 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                            : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-mono tracking-wide ${selectedTeam?.id === team.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                              {team.name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {team.role === 'admin' ? (
                                <span className="text-purple-400 flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  ADMIN
                                </span>
                              ) : (
                                <span className="text-cyan-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  MEMBER
                                </span>
                              )}
                            </p>
                          </div>
                          {team.role === 'admin' && (
                            <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Team Details */}
            {selectedTeam ? (
              <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 lg:col-span-3 shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
                
                <div className="relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                        {selectedTeam.name}
                      </h2>
                      <p className="text-sm text-gray-400 font-mono mt-1">
                        {selectedTeam.description || 'NO DESCRIPTION PROVIDED'}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        CREATED: {new Date(selectedTeam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="primary" size="sm" onClick={handleViewTasks} className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono">
                        <CheckSquare className="w-4 h-4 mr-2" />
                        VIEW TASKS
                      </Button>
                      {userRole === 'admin' && (
                        <>
                          <Button variant="secondary" size="sm" onClick={handleEditTeam} className="border border-white/10 hover:border-purple-500/30 font-mono text-gray-300 hover:text-white">
                            <Edit2 className="w-4 h-4 mr-2" />
                            EDIT
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setShowInviteModal(true)} className="border border-white/10 hover:border-purple-500/30 font-mono text-gray-300 hover:text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            INVITE
                          </Button>
                          <Button variant="secondary" size="sm" onClick={handleDeleteTeam} disabled={deleteLoading} className="border border-red-500/30 hover:border-red-500/60 font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            {deleteLoading ? (
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                DELETE
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-mono tracking-wider mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      MEMBERS ({teamMembers.length})
                    </h3>
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all duration-300 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                              {member.profile_photo ? (
                                <img 
                                  src={`${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${member.profile_photo.startsWith('/') ? member.profile_photo : `/${member.profile_photo}`}`} 
                                  alt={member.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                member.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-white font-mono">{member.name}</p>
                                {member.role === 'admin' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    ADMIN
                                  </span>
                                )}
                                {member.email === currentUser.email && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3 text-purple-400" />
                                <p className="text-xs text-gray-400 font-mono">{member.email}</p>
                              </div>
                            </div>
                          </div>
                          
                          {userRole === 'admin' && member.email !== currentUser.email && (
                            <div className="flex items-center gap-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                className="text-sm px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono tracking-wider hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
                              >
                                <option value="member" className="bg-black text-white">MEMBER</option>
                                <option value="admin" className="bg-black text-white">ADMIN</option>
                              </select>
                              <button
                                onClick={() => handleRemoveMember(member.id, member.name)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-300 group/btn"
                              >
                                <Trash2 className="w-4 h-4 text-red-400 group-hover/btn:scale-110 transition-transform" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-12 lg:col-span-3 text-center shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Users className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-white font-mono tracking-wider">SELECT A TEAM TO VIEW DETAILS</p>
                  {teams.length === 0 && (
                    <Button variant="primary" onClick={() => setShowCreateModal(true)} className="mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono">
                      <Plus className="w-4 h-4 mr-2" />
                      DEPLOY FIRST TEAM
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Team Modal */}
          {showCreateModal && (
            <>
              <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]" 
                onClick={() => setShowCreateModal(false)} 
              />
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] p-6 animate-slide-up relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono">DEPLOY NEW TEAM</h3>
                      <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/5 rounded-lg transition-all duration-300 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">TEAM NAME <span className="text-purple-400">*</span></label>
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                          placeholder="Enter team name..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">DESCRIPTION</label>
                        <textarea
                          value={newTeamDesc}
                          onChange={(e) => setNewTeamDesc(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono resize-none"
                          placeholder="Describe what this team does..."
                        />
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button type="submit" disabled={createLoading} className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider">
                          {createLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              DEPLOYING...
                            </>
                          ) : (
                            'DEPLOY TEAM'
                          )}
                        </button>
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white font-bold py-2.5 rounded-xl transition-all duration-300 font-mono tracking-wider">
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Edit Team Modal */}
          {showEditModal && (
            <>
              <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]" 
                onClick={() => setShowEditModal(false)} 
              />
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] p-6 animate-slide-up relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono">EDIT TEAM</h3>
                      <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-white/5 rounded-lg transition-all duration-300 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateTeam(); }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">TEAM NAME <span className="text-purple-400">*</span></label>
                        <input
                          type="text"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                          placeholder="Enter team name..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">DESCRIPTION</label>
                        <textarea
                          value={editTeamDesc}
                          onChange={(e) => setEditTeamDesc(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono resize-none"
                          placeholder="Describe what this team does..."
                        />
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button type="submit" disabled={editLoading} className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider">
                          {editLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              UPDATING...
                            </>
                          ) : (
                            'UPDATE TEAM'
                          )}
                        </button>
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white font-bold py-2.5 rounded-xl transition-all duration-300 font-mono tracking-wider">
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Invite Member Modal */}
          {showInviteModal && (
            <>
              <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]" 
                onClick={() => setShowInviteModal(false)} 
              />
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] p-6 animate-slide-up relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono">INVITE MEMBER</h3>
                      <button 
                        onClick={() => setShowInviteModal(false)} 
                        className="p-1 hover:bg-white/5 rounded-lg transition-all duration-300 text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleInviteMember(); }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">EMAIL ADDRESS</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                          placeholder="member@example.com"
                          required
                        />
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          IF USER DOESN'T EXIST, THEY'LL BE INVITED TO JOIN TASKFLOW
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">ROLE</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono appearance-none cursor-pointer hover:border-purple-500/30"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '12px'
                          }}
                        >
                          <option value="member" className="bg-black text-white hover:bg-purple-600">MEMBER (CAN VIEW TEAM)</option>
                          <option value="admin" className="bg-black text-white hover:bg-purple-600">ADMIN (CAN MANAGE TEAM)</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button 
                          type="submit" 
                          disabled={inviteLoading} 
                          className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider"
                        >
                          {inviteLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              SENDING...
                            </>
                          ) : (
                            'SEND INVITATION'
                          )}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowInviteModal(false)} 
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white font-bold py-2.5 rounded-xl transition-all duration-300 font-mono tracking-wider"
                        >
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
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

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%) rotate(45deg); }
          to { transform: translateX(100%) rotate(45deg); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        .glitch-wrapper {
          position: relative;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 2px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        /* Input autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0.5) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        /* Style select dropdown options */
        select option {
          background-color: #1a1a1a;
          color: white;
          padding: 8px;
        }
        
        select option:hover {
          background-color: #7c3aed;
        }
      `}</style>
    </div>
  );
};