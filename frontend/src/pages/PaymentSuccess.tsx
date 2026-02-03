import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import type { Payment } from '../services/paymentService';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('ID de sesión no encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await paymentService.verifyPayment(sessionId);
      setPayment(data);
    } catch (err: any) {
      setError(err.message || 'Error al verificar el pago');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      free: 'Gratuito',
      pro: 'Pro',
      business: 'Business',
    };
    return names[tier] || tier;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-lg text-gray-700">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Error en el Pago</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/subscription')}
            className="mt-6 w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Volver a Suscripciones
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Pago No Encontrado</h1>
          <p className="mt-2 text-gray-600">No se encontró información del pago.</p>
          <button
            onClick={() => navigate('/subscription')}
            className="mt-6 w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Volver a Suscripciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">¡Pago Exitoso!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Tu suscripción ha sido activada correctamente
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {getTierName(payment.subscriptionTier)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Monto</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {formatAmount(payment.amount, payment.currency)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {payment.status === 'completed' ? 'Completado' : payment.status}
                </span>
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">ID de Pago</dt>
              <dd className="text-sm font-mono text-gray-700">{payment.stripePaymentId}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Fecha</dt>
              <dd className="text-sm text-gray-700">
                {new Date(payment.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Ir al Panel Principal
          </button>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-white text-indigo-600 border-2 border-indigo-600 py-3 px-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Ver Mi Suscripción
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Recibirás un correo de confirmación con los detalles de tu compra.</p>
        </div>
      </div>
    </div>
  );
};
