import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import { Wallet } from 'lucide-react'

export default function CashRegistersTab() {
    return <GenericCrudTab
        queryKey="cash-registers" apiPath="/settings/cash-registers" label="Kasa"
        icon={Wallet}
        emptyForm={{ name: '', is_default: false }}
        renderForm={(form, setForm) => (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kasa Adı *</label>
                    <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={form.is_default || false} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Varsayılan kasa</span>
                </label>
            </>
        )}
    />
}
