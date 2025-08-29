'use client';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { useServices, useCreateWalkIn } from '@/lib/queries';
import { calculateFinalPrice } from '@/lib/supabase-db';
import ClientSelector from './ClientSelector';
import { User, DollarSign } from 'lucide-react';

type Props = {
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string; // YYYY-MM-DD
};

export default function WalkInForm({ onClose, onSaved, defaultDate }: Props) {
  const today = DateTime.now().toFormat('yyyy-LL-dd');
  const [date, setDate] = useState(defaultDate || today);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [serviceId, setServiceId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>(''); // Para servicios personalizados
  const [duration, setDuration] = useState(30);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [customDiscount, setCustomDiscount] = useState<number | undefined>(undefined);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useCustomService, setUseCustomService] = useState(false);

  const { data: services = [], isLoading: servicesLoading } = useServices();
  const createMutation = useCreateWalkIn();

  const selectedService = services.find(s => s.id === serviceId);
  const basePrice = customPrice || selectedService?.price || 0;
  
  const priceCalculation = basePrice > 0 ? calculateFinalPrice(
    basePrice, 
    paymentMethod, 
    customDiscount
  ) : { finalPrice: 0, discount: 0 };

  const inputCls = 
    'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 ' +
    'bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 ' +
    'placeholder-zinc-400 dark:placeholder-zinc-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ' +
    'disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (useCustomService) {
      if (!serviceName.trim()) {
        setError('Ingresa el nombre del servicio.');
        return;
      }
      if (!customPrice || customPrice <= 0) {
        setError('Ingresa un precio válido para el servicio.');
        return;
      }
    } else {
      if (!serviceId) {
        setError('Selecciona un servicio.');
        return;
      }
    }

    const walkInData = {
      date,
      timestamp: DateTime.now().toISO()!,
      clientId,
      serviceId: useCustomService ? undefined : serviceId,
      serviceName: useCustomService ? serviceName.trim() : undefined,
      paymentMethod,
      finalPrice: priceCalculation.finalPrice,
      listPrice: basePrice,
      discount: priceCalculation.discount,
      notes: notes.trim() || undefined,
      duration,
    };

    try {
      await createMutation.mutateAsync(walkInData);
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al registrar el walk-in');
    }
  };

  const isFormDisabled = servicesLoading || createMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-neutral-900 shadow-xl max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-semibold">Registrar Walk-in</h2>
            {isFormDisabled && (
              <span className="ml-2 text-sm text-zinc-500">
                {servicesLoading ? 'Cargando...' : 'Guardando...'}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <p className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {/* Mutation error */}
          {createMutation.error && (
            <p className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              Error al crear walk-in: {createMutation.error.message}
            </p>
          )}

          {/* Fecha */}
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              disabled={isFormDisabled}
              max={DateTime.now().toFormat('yyyy-LL-dd')} // No permitir fechas futuras
            />
          </label>

          {/* Cliente */}
          <ClientSelector
            selectedClientId={clientId}
            onClientSelected={setClientId}
          />

          {/* Tipo de servicio */}
          <div className="space-y-3">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Servicio</span>
            
            <div className="flex gap-2">
              <label className="flex items-center gap-2 flex-1">
                <input
                  type="radio"
                  name="serviceType"
                  checked={!useCustomService}
                  onChange={() => {
                    setUseCustomService(false);
                    setServiceName('');
                    setCustomPrice(undefined);
                  }}
                  className="accent-sky-600"
                  disabled={isFormDisabled}
                />
                <span className="text-sm">Servicio existente</span>
              </label>
              
              <label className="flex items-center gap-2 flex-1">
                <input
                  type="radio"
                  name="serviceType"
                  checked={useCustomService}
                  onChange={() => {
                    setUseCustomService(true);
                    setServiceId('');
                  }}
                  className="accent-sky-600"
                  disabled={isFormDisabled}
                />
                <span className="text-sm">Servicio personalizado</span>
              </label>
            </div>

            {!useCustomService ? (
              // Servicio existente
              servicesLoading ? (
                <div className="h-10 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-lg"></div>
              ) : (
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className={inputCls}
                  disabled={isFormDisabled}
                >
                  <option value="">Selecciona un servicio...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ${s.price}
                    </option>
                  ))}
                </select>
              )
            ) : (
              // Servicio personalizado
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Nombre del servicio"
                  className={inputCls}
                  disabled={isFormDisabled}
                />
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Precio"
                    className={`${inputCls} pl-10`}
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Duración */}
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Duración (minutos)</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputCls}
              disabled={isFormDisabled}
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </label>

          {/* Información de pago */}
          <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-neutral-900/40 p-4">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pago
            </h3>
            
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Método de pago</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer')}
                className={inputCls}
                disabled={isFormDisabled}
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </label>

            {/* Descuento personalizado */}
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Descuento personalizado (%)
                <span className="text-xs text-zinc-500 ml-1">
                  (opcional, deja vacío para automático)
                </span>
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={customDiscount ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDiscount(val === '' ? undefined : Number(val));
                }}
                className={inputCls}
                disabled={isFormDisabled}
                placeholder={`Auto: ${paymentMethod === 'cash' ? '10' : '0'}%`}
              />
            </label>

            {/* Cálculo de precios */}
            {basePrice > 0 && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Precio base:</span>
                    <span>${basePrice}</span>
                  </div>
                  
                  {priceCalculation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({priceCalculation.discount}%):</span>
                      <span>-${Math.round(basePrice * priceCalculation.discount / 100)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium text-lg border-t pt-2 text-zinc-900 dark:text-zinc-100">
                    <span>Total cobrado:</span>
                    <span>${priceCalculation.finalPrice}</span>
                  </div>
                  
                  {paymentMethod === 'cash' && priceCalculation.discount > 0 && (
                    <div className="text-xs text-green-600 mt-2">
                      Descuento por efectivo aplicado automáticamente
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
              rows={3}
              disabled={isFormDisabled}
              placeholder="Observaciones, detalles adicionales..."
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createMutation.isPending}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isFormDisabled}
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Registrando...
              </>
            ) : (
              'Registrar Walk-in'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}