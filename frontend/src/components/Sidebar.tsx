import { BookOpen } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-lg">
          <BookOpen size={24} />
        </div>
        <span className="text-xl font-bold text-gray-900">LearnMind AI</span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>© 2026 LearnMind AI</p>
        <p>Plataforma de procesamiento de documentos con IA</p>
      </div>
    </aside>
  );
}