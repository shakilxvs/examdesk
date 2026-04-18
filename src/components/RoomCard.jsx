import { useState } from 'react';
import { MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoomColor } from '../utils/helpers';

export default function RoomCard({ room, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const color = getRoomColor(room.color_tag);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 group">
      {/* Color accent strip */}
      <div className={`h-1.5 ${color.bg}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${color.light} ${color.border} border flex items-center justify-center`}>
            <span className={`text-lg font-display font-bold ${color.text}`}>
              {room.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-40 animate-scale-in">
                  <button
                    onClick={() => { setMenuOpen(false); onRename?.(room); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete?.(room); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <h3 className="font-display font-semibold text-gray-900 text-base leading-tight">{room.name}</h3>
        {room.subject && <p className="text-sm text-gray-400 mt-0.5">{room.subject}</p>}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {room.examCount ?? 0} exam{room.examCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => navigate(`/teacher/room/${room.id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <Eye size={13} /> View Room
          </button>
        </div>
      </div>
    </div>
  );
}
