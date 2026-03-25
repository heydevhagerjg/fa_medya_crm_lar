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
                    <label className="block text-sm font-medium text-[#1A1A2E] dark:text-white mb-1">Kasa Adı *</label>
                    <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-[#1A1A2E] dark:text-white focus:outline-none focus:border-[#905EFC]" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={form.is_default || false} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-[#1A1A2E] dark:text-white">Varsayılan kasa</span>
                </label>
            </>
        )}
    />
}
