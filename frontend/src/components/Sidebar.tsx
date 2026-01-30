import { Home as HomeIcon, FolderOpen, BrainCircuit, Users, Settings, LogOut, BookOpen, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ seccionActual, setSeccion }: { seccionActual: string, setSeccion: (s: string) => void }) {
  const { logout } = useAuth();
  
  const menuItems = [
    { id: 'inicio', icon: HomeIcon, label: 'Inicio' },
    { id: 'materiales', icon: FolderOpen, label: 'Mis Materiales' },
    { id: 'transcripciones', icon: Headphones, label: 'Transcripciones' },
    { id: 'ia', icon: BrainCircuit, label: 'IA Lab' },
    { id: 'comunidades', icon: Users, label: 'Comunidades' },
  ];

  return (
    <aside className="fixed top-0 left-0 z-50 flex flex-col w-64 h-screen bg-white border-r border-gray-200">
      <div className="flex items-center gap-3 p-6 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-lg">
          <BookOpen size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight text-gray-800">LearnMind AI</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSeccion(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              seccionActual === item.id
                ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-1 border-t border-gray-100">
        <button className="flex items-center w-full gap-3 px-4 py-3 text-gray-500 transition-all hover:bg-gray-50 rounded-xl">
          <Settings size={20} />
          <span>Configuración</span>
        </button>
        <button onClick={logout} className="flex items-center w-full gap-3 px-4 py-3 text-red-500 transition-all hover:bg-red-50 rounded-xl">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}