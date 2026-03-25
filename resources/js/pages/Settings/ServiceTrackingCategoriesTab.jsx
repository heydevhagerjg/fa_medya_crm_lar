import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function ServiceTrackingCategoriesTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_service_tracking_feature === false || user?.tenant?.plan_service_tracking_feature === 0
    if (isFeatureDisabled) return <PlanRestrictionView featureName="Hizmet Takibi" />

    return <GenericCrudTab
        queryKey="service-tracking-categories" apiPath="/settings/service-tracking-categories" label="Hizmet Takip Kategorisi"
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            </div>
        )}
    />
}
