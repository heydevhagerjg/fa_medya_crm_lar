import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import { FolderOpen } from 'lucide-react'

export default function ExpenseCategoriesTab() {
    return <GenericCrudTab
        queryKey="expense-categories" apiPath="/settings/expense-categories" label="Kategori"
        icon={FolderOpen}
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium text-[#1A1A2E] dark:text-white mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-[#E5E9F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-[#1A1A2E] dark:text-white focus:outline-none focus:border-[#905EFC]" />
            </div>
        )}
    />
}
