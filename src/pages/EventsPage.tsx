import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Users, 
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EventsPage = () => {
  const { events, loading, refetch } = useEvents();
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
      alert('Failed to create event');
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
      alert('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRSVP = async (eventId: string, status: 'joined' | 'maybe' | 'declined') => {
    if (!profile) return;
    try {
      await dbService.upsertRSVP(eventId, profile.id, status);
      alert('RSVP updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update RSVP');
    }
  };

  return (
    <div className="space-y-8 text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Community Events</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Tournaments, events, and gatherings on StrawberrySMP.</p>
        </div>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all shadow-lg shadow-strawberry-600/20"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <motion.div 
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{event.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-500' :
                    event.status === 'ongoing' ? 'bg-green-500/10 text-green-600 dark:text-green-500' :
                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
                
                <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2">{event.description || 'No description provided.'}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <Clock size={16} className="text-strawberry-600 dark:text-strawberry-500" />
                    <span>{new Date(event.start_time).toLocaleString()}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <MapPin size={16} className="text-strawberry-600 dark:text-strawberry-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRSVP(event.id, 'joined')}
                    className="px-4 py-1.5 bg-strawberry-600 rounded-lg text-xs font-bold text-white hover:bg-strawberry-700 transition-colors"
                  >
                    Join
                  </button>
                  <button 
                    onClick={() => handleRSVP(event.id, 'maybe')}
                    className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Maybe
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="p-1.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                    >
                      {deletingId === event.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  )}
                  <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Users size={14} />
                    <span>RSVP now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 p-12 rounded-2xl text-center">
          <Calendar className="mx-auto text-neutral-400 dark:text-neutral-700 mb-4" size={48} />
          <p className="text-neutral-600 dark:text-neutral-500 text-lg">No events scheduled yet.</p>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative text-neutral-900 dark:text-neutral-100"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Event Title</label>
                  <input 
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full mt-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                    placeholder="E.g. Survival Games Tournament"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full mt-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors h-24"
                    placeholder="Tell players what this event is about..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Start Time</label>
                    <input 
                      required
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={e => setFormData({...formData, start_time: e.target.value})}
                      className="w-full mt-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Location</label>
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full mt-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-neutral-900 dark:text-white focus:border-strawberry-500 transition-colors"
                      placeholder="E.g. War Arena"
                    />
                  </div>
                </div>

                <button 
                  disabled={isCreating}
                  type="submit"
                  className="w-full mt-6 py-3 bg-strawberry-600 rounded-xl font-bold text-white hover:bg-strawberry-700 transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Create Event'}
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
