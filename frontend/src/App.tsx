import { useState } from 'react';
import { User, Mail, Lock, ArrowRight, BookOpen, Check, X } from 'lucide-react';
import { Home } from './pages/Home';
import { useAuth } from './context/AuthContext';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { isAuthenticated, login, register, isLoading } = useAuth();

  // Validar contraseña segura
  const validatePassword = (pwd: string) => {
    return {
      hasMinLength: pwd.length >= 8,
      hasLetters: /[a-zA-Z]/.test(pwd),
      hasNumbers: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
  };

  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(val => val);

  // SI EL USUARIO ESTÁ AUTENTICADO, MUESTRA EL HOME
  if (isAuthenticated) {
    return <Home />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Combinar nombre y apellido
        const fullName = `${firstName} ${lastName}`.trim();
        await register(fullName, email, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en la operación';
      setLocalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 font-sans bg-slate-50">
      
      {/* Contenedor Principal */}
      <div className="flex flex-col w-full max-w-5xl overflow-hidden bg-white shadow-2xl rounded-3xl md:flex-row min-h-150">
        
        {/* Lado Izquierdo: Visual y Marca (Siempre visible) */}
        <div className="relative flex flex-col justify-between p-12 overflow-hidden text-white bg-blue-700 md:w-1/2">
          {/* Círculos decorativos de fondo */}
          <div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 translate-x-1/2 translate-y-1/2 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>

          {/* Logo y Texto */}
          <div className="z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-white/10">
                <BookOpen size={32} />
              </div>
              <span className="text-3xl font-bold tracking-tight">LearnMind AI</span>
            </div>
            <h2 className="mb-6 text-4xl font-bold leading-tight">
              {isLogin ? "Bienvenido de nuevo a tu espacio de estudio." : "Únete a la nueva era del aprendizaje."}
            </h2>
            <p className="text-lg leading-relaxed text-blue-100">
              {isLogin 
                ? "Convierte tus apuntes en conocimiento real en segundos. Tus resúmenes, mapas mentales, traducciones y cuestionarios inteligentes te están esperando para continuar." 
                : "Crea tu cuenta hoy y transforma cualquier PDF o apunte en conocimiento instantáneo."}
            </p>
          </div>

          <div className="z-10 mt-8 text-sm text-blue-200">
            © 2026 LearnMind AI Inc.
          </div>
        </div>

        {/* Lado Derecho: Formulario Dinámico */}
        <div className="flex flex-col justify-center p-8 bg-white md:w-1/2 md:p-12">
          <div className="w-full max-w-md mx-auto">
            
            <h3 className="mb-2 text-3xl font-bold text-gray-900">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h3>
            <p className="mb-8 text-gray-500">
              {isLogin ? "Ingresa tus datos para continuar" : "Rellena el formulario para comenzar"}
            </p>

            {/* Formulario con onSubmit conectado */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {localError && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                  {localError}
                </div>
              )}

              {!isLogin && (
                <>
                  <div className="group">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Nombre</label>
                    <div className="relative">
                      <User className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={20} />
                      <input 
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ej. Juan"
                        required={!isLogin}
                        className="w-full py-3 pl-10 pr-4 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Apellido</label>
                    <div className="relative">
                      <User className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={20} />
                      <input 
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ej. Pérez"
                        required={!isLogin}
                        className="w-full py-3 pl-10 pr-4 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="estudiante@ejemplo.com"
                    required
                    className="w-full py-3 pl-10 pr-4 transition-all border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full py-3 pl-10 pr-4 transition-all border outline-none rounded-xl bg-gray-50 focus:bg-white ${
                      !isLogin && password
                        ? isPasswordValid
                          ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                          : 'border-red-500 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                </div>
                
                {/* Requisitos de contraseña (solo visible en registro) */}
                {!isLogin && password && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Requisitos de contraseña segura:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasMinLength ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={passwordValidation.hasMinLength ? 'text-green-600' : 'text-red-600'}>
                          Mínimo 8 caracteres
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasLetters ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={passwordValidation.hasLetters ? 'text-green-600' : 'text-red-600'}>
                          Contiene letras (a-z, A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasNumbers ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}>
                          Contiene números (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasSpecial ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={passwordValidation.hasSpecial ? 'text-green-600' : 'text-red-600'}>
                          Contiene caracteres especiales (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Principal con estado de carga */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    {isLogin ? "Ingresar a la Plataforma" : "Registrarse Gratis"}
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center"><span className="px-4 text-sm text-gray-500 bg-white">O continúa con</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                  Microsoft
                </button>
              </div>

            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="font-semibold text-blue-600 transition-all hover:text-blue-700 hover:underline"
                >
                  {isLogin ? "Regístrate gratis" : "Inicia sesión"}
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default App