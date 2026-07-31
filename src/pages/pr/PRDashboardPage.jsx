import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Image as ImageIcon, 
  Video, 
  UploadCloud, 
  PlusCircle, 
  Eye, 
  Trash2, 
  Download, 
  LogOut, 
  Camera, 
  Activity, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { galleryApi } from '../../services/galleryApi';
import { getMediaPreviewUrl, triggerMediaDownload } from '../../utils/googleDriveHelper';
import { useToast } from '../../context/ToastContext';

export const PRDashboardPage = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalPhotos: 0,
    totalVideos: 0,
    recentUploads: [],
  });
  const [eventsMap, setEventsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsData = await galleryApi.getDashboardStats();
      const eventsList = await galleryApi.getEvents();
      
      const map = {};
      eventsList.forEach((e) => {
        map[e.id] = e.event_name;
      });
      setEventsMap(map);
      setStats(statsData);
    } catch (err) {
      showToast('Failed to load PR dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    galleryApi.logoutPR();
    showToast('Logged out from PR Portal', 'info');
    navigate('/pr/login');
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;

    try {
      await galleryApi.deleteMedia(mediaId);
      showToast('Media deleted successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to delete media item', 'error');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md uppercase tracking-wider">
                PR Coordinator Portal
              </span>
              <span className="text-xs text-white/80">• Live Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Media & Event Command Center
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl">
              Manage tournament gallery albums, upload Google Drive media, publish event photos & videos for public access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={fetchDashboardData}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/gallery"
              target="_blank"
              className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold transition flex items-center gap-2"
            >
              <span>Public Gallery</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-md transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to="/pr/events"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition group flex items-center gap-4"
          >
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Manage Events</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create, edit, or delete event albums</p>
            </div>
          </Link>

          <Link
            to="/pr/upload"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition group flex items-center gap-4"
          >
            <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Upload Media</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add photos & videos via Google Drive</p>
            </div>
          </Link>

          <Link
            to="/gallery"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition group flex items-center gap-4 sm:col-span-2 md:col-span-1"
          >
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Preview Public View</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Experience gallery as end users</p>
            </div>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Events</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                {loading ? '...' : stats.totalEvents}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Trophy className="w-7 h-7" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Photos</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                {loading ? '...' : stats.totalPhotos}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="w-7 h-7" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Videos</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                {loading ? '...' : stats.totalVideos}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-500">
              <Video className="w-7 h-7" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recent Uploads</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                {loading ? '...' : stats.recentUploads.length}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Recent Uploads Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" /> Recent Media Uploads
            </h2>
            <Link
              to="/pr/upload"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              + Upload More
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading recent media...</div>
          ) : stats.recentUploads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No media uploaded yet</p>
              <Link
                to="/pr/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Upload First Photo / Video
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 uppercase text-[10px] font-black text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Preview</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Event</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4">Uploaded At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recentUploads.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                          {item.media_type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-orange-400">
                              <Video className="w-5 h-5" />
                            </div>
                          ) : (
                            <img
                              src={getMediaPreviewUrl(item.media_url)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {eventsMap[item.event_id] || `Event #${item.event_id}`}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.media_type === 'video' 
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.media_type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(item.uploaded_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => triggerMediaDownload(item.media_url, `${item.title}.${item.media_type === 'video' ? 'mp4' : 'jpg'}`)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            title="Download Media"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedia(item.id)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 transition"
                            title="Delete Media"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
