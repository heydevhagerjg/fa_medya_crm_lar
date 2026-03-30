import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import PlanRestrictionView from '../../components/ui/PlanRestrictionView.jsx'
import { useAuthStore } from '../../stores/index.js'

export default function ServiceTrackingCategoriesTab() {
    const { user } = useAuthStore()
    const isFeatureDisabled = user?.tenant?.plan_service_tracking_feature === false || user?.tenant?.plan_service_tracking_feature === 0
    if (isFeatureDisabled) return <PlanRestrictionView featureName="Hizmet Takibi" />

    return <GenericCrudTab
        queryKey="service-tracking-categories" apiPath="/settings/service-tracking-categories" label="Hizmet Takip Kategorisi"
        pageTitle="Hizmet Takip Kategorileri"
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border rounded-lg text-sm theme-input" />
            </div>
        )}
    />
}
