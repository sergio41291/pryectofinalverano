import React, { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { CheckCircle } from 'lucide-react';

interface Plan {
  tier: 'free' | 'pro' | 'business';
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Gratis',
    features: [
      '5 documentos por mes',
      '10MB almacenamiento',
      'Sin grupos colaborativos',
      '5 mapas mentales',
      'Soporte por email',
    ],
    cta: 'Plan Actual',
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 9.99,
    priceLabel: '$9.99/mes',
    features: [
      '100 documentos por mes',
      '5GB almacenamiento',
      'Hasta 5 grupos colaborativos',
      '100 mapas mentales',
      'Soporte prioritario',
      'Exportación avanzada',
    ],
    cta: 'Actualizar a Pro',
    popular: true,
  },
  {
    tier: 'business',
    name: 'Business',
    price: 29.99,
    priceLabel: '$29.99/mes',
    features: [
      'Documentos ilimitados',
      'Almacenamiento ilimitado',
      'Grupos ilimitados',
      'Mapas mentales ilimitados',
      'Soporte 24/7',
      'API access',
      'Análisis avanzado',
    ],
    cta: 'Actualizar a Business',
  },
];

interface Props {
  currentTier?: 'free' | 'pro' | 'business';
}

export const SubscriptionPlans: React.FC<Props> = ({ currentTier = 'free' }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tier: 'PRO' | 'BUSINESS') => {
    try {
      setLoading(tier);
      setError(null);

      // Crear sesión de checkout
      const frontendUrl = window.location.origin;
      const { url } = await paymentService.createCheckoutSession(
        tier,
        `${frontendUrl}/subscription/success`,
        `${frontendUrl}/subscription`
      );

      // Redirigir a Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(null);
    }
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planes de Suscripción
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Elige el plan perfecto para tus necesidades
          </p>
        </div>

        {error && (
          <div className="mt-8 max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative bg-white border rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.popular ? 'border-indigo-500 border-2' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex rounded-full bg-indigo-500 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.priceLabel}</span>
                </p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.tier === 'free') return;
                    if (currentTier === plan.tier) return;
                    handleUpgrade(plan.tier.toUpperCase() as 'PRO' | 'BUSINESS');
                  }}
                  disabled={loading !== null || currentTier === plan.tier}
                  className={`mt-8 w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    currentTier === plan.tier
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400'
                      : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 disabled:bg-gray-100'
                  }`}
                >
                  {loading === plan.tier.toUpperCase()
                    ? 'Procesando...'
                    : currentTier === plan.tier
                    ? 'Plan Actual'
                    : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Todos los pagos se procesan de forma segura con Stripe.</p>
          <p className="mt-2">Puedes cancelar tu suscripción en cualquier momento.</p>
        </div>
      </div>
    </div>
  );
};
