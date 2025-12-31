import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  FileEdit,
  BarChart3,
  GitCompare,
  Download,
  Database,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/pacientes', icon: Users, label: 'Pacientes' },
  { path: '/entrada', icon: FileEdit, label: 'Entrada de Dados' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/comparacao', icon: GitCompare, label: 'Comparação' },
  { path: '/exportar', icon: Download, label: 'Exportar' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-gray-800">TCC Nefrite</h1>
              <p className="text-xs text-gray-500">Coleta de Dados</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            TCC - Perfil Clínico NL
          </p>
          <p className="text-xs text-gray-400 text-center">
            CESUPA - Medicina
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
