import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import type { Subscription } from '../../services/paymentService';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

export const ManageSubscription: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentService.getCurrentSubscription();
      setSubscription(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Volverás al plan gratuito.')) {
      return;
    }

    try {
      setCanceling(true);
      setError(null);
      await paymentService.cancelSubscription();
      setSuccess('Suscripción cancelada exitosamente. Ahora estás en el plan gratuito.');
      
      // Reload subscription
      setTimeout(() => {
        loadSubscription();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al cancelar suscripción');
    } finally {
      setCanceling(false);
    }
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      free: 'Gratuito',
      pro: 'Pro',
      business: 'Business',
    };
    return names[tier] || tier;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'text-gray-900 bg-gray-100',
      pro: 'text-blue-900 bg-blue-100',
      business: 'text-purple-900 bg-purple-100',
    };
    return colors[tier] || colors.free;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Gestionar Suscripción</h3>
        </div>
      </div>

      <div className="px-6 py-6">
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {subscription && (
          <div className="space-y-6">
            {/* Current Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Actual
              </label>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold ${getTierColor(
                    subscription.tier
                  )}`}
                >
                  {getTierName(subscription.tier)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <div className="flex items-center">
                {subscription.isActive ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Activa</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700 font-medium">Inactiva</span>
                  </>
                )}
              </div>
            </div>

            {/* Stripe Customer ID */}
            {subscription.stripeCustomerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Cliente Stripe
                </label>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800">
                  {subscription.stripeCustomerId}
                </code>
              </div>
            )}

            {/* Actions */}
            {subscription.tier !== 'free' && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {canceling ? 'Cancelando...' : 'Cancelar Suscripción'}
                </button>
                <p className="mt-2 text-sm text-gray-500">
                  Al cancelar tu suscripción, volverás al plan gratuito inmediatamente.
                </p>
              </div>
            )}

            {subscription.tier === 'free' && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Estás en el plan gratuito. Dirígete a la pestaña "Planes" para actualizar tu
                  suscripción.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
