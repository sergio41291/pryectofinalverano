import React, { useState, useEffect } from 'react';
import { SubscriptionPlans } from '../components/subscription/SubscriptionPlans';
import { PaymentHistory } from '../components/subscription/PaymentHistory';
import { ManageSubscription } from '../components/subscription/ManageSubscription';
import { paymentService } from '../services/paymentService';
import type { Subscription } from '../services/paymentService';
import { CreditCard, Receipt, Settings } from 'lucide-react';

type Tab = 'plans' | 'history' | 'manage';

export const SubscriptionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await paymentService.getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const tabs = [
    { id: 'plans' as Tab, label: 'Planes', icon: CreditCard },
    { id: 'manage' as Tab, label: 'Gestionar', icon: Settings },
    { id: 'history' as Tab, label: 'Historial', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Suscripción</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu plan, pagos y configuración de suscripción
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'plans' && (
            <SubscriptionPlans currentTier={subscription?.tier} />
          )}

          {activeTab === 'manage' && <ManageSubscription />}

          {activeTab === 'history' && <PaymentHistory />}
        </div>
      </div>
    </div>
  );
};
