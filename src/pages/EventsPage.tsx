import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useEvents } from '../hooks/useEvents';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import {
  Calendar,
  MapPin,
  Clock,
  X,
  Loader2,
  Trash2,
  Users,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EventsPage = () => {
  const { events, loading, error, refetch } = useEvents();
  const { profile } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    location: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsCreating(true);
    try {
      await dbService.createEvent({
        ...formData,
        created_by: profile.id,
        status: 'upcoming',
        end_time: null
      });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', start_time: '', location: '' });
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setDeletingId(id);
    try {
      await dbService.deleteEvent(id);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRSVP = async (eventId: string, status: 'joined' | 'maybe' | 'declined') => {
    if (!profile) return;
    try {
      await dbService.upsertRSVP(eventId, profile.id, status);
      toast.success('RSVP updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update RSVP');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
            <Calendar size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Events
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              sweet activities sprouting soon!
            </p>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-strawberry-600 text-white rounded-[1.5rem] font-black italic uppercase tracking-widest text-xs shadow-xl shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all active:scale-95 text-center"
          >
            Create Event
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] text-center"
        >
          <AlertCircle className="mx-auto text-red-500 mb-6" size={48} />
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-red-600 mb-2">Transmission Interrupted</h2>
          <p className="text-red-500/70 font-bold uppercase tracking-widest text-[10px] mb-8 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-8 py-3 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
          >
            Reconnect
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl shadow-neutral-900/5 hover:border-strawberry-500/30 transition-all"
            >
              <div className="p-8 flex-1 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white leading-tight">{event.title}</h3>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic shrink-0 ${event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-500' :
                    event.status === 'ongoing' ? 'bg-green-500/10 text-green-600 dark:text-green-500' :
                      'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400'
                    }`}>
                    {event.status}
                  </span>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 italic line-clamp-3 leading-relaxed">"{event.description || 'Accessing mission brief...'}"</p>

                <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
                      <Clock size={16} className="text-strawberry-600" />
                      <span>{new Date(event.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
                      <Users size={16} className="text-strawberry-600" />
                      <span>{(event as any).rsvpCount} Joined</span>
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
                      <MapPin size={16} className="text-strawberry-600" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>              </div>

              <div className="bg-neutral-50 dark:bg-white/5 p-6 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRSVP(event.id, 'joined')}
                    className="px-5 py-2.5 bg-strawberry-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-strawberry-700 transition-all active:scale-95 shadow-lg shadow-strawberry-600/20"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => handleRSVP(event.id, 'maybe')}
                    className="px-5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
                  >
                    Maybe
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 hover:text-red-600 dark:hover:text-red-500 transition-all active:scale-90"
                    >
                      {deletingId === event.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-sm">
          <Calendar className="mx-auto text-neutral-300 mb-8" size={64} />
          <p className="text-2xl font-black italic uppercase tracking-tighter">No events scheduled.</p>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl shadow-neutral-900/20"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Initiate New Event</h2>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Event Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-strawberry-500/30 rounded-2xl p-4 text-sm font-medium outline-none transition-all"
                    placeholder="E.g. Survival Games"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-strawberry-500/30 rounded-2xl p-4 text-sm font-medium outline-none transition-all h-32 italic"
                    placeholder="Details about the mission..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Start Time</label>
                    <input
                      required
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-strawberry-500/30 rounded-2xl p-4 text-sm font-bold uppercase outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-strawberry-500/30 rounded-2xl p-4 text-sm font-medium outline-none transition-all"
                      placeholder="War Arena"
                    />
                  </div>
                </div>

                <button
                  disabled={isCreating}
                  type="submit"
                  className="w-full py-4 bg-strawberry-600 rounded-2xl font-black italic uppercase tracking-widest text-white hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/20 active:scale-95 mt-4"
                >
                  {isCreating ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Initiate Operation'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventsPage;