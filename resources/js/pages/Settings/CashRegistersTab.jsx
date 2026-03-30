import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import { Wallet } from 'lucide-react'

export default function CashRegistersTab() {
    return <GenericCrudTab
        queryKey="cash-registers" apiPath="/settings/cash-registers" label="Kasa"
        pageTitle="Kasa Yönetimi"
        icon={Wallet}
        emptyForm={{ name: '', is_default: false }}
        renderForm={(form, setForm) => (
            <>
                <div>
                    <label className="block text-sm font-medium theme-text-primary mb-1">Kasa Adı *</label>
                    <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="theme-input" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={form.is_default || false} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} className="rounded" />
                    <span className="text-sm theme-text-primary">Varsayılan kasa</span>
                </label>
            </>
        )}
    />
}
