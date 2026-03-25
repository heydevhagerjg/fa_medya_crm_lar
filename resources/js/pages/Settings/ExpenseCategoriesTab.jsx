import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import { FolderOpen } from 'lucide-react'

export default function ExpenseCategoriesTab() {
    return <GenericCrudTab
        queryKey="expense-categories" apiPath="/settings/expense-categories" label="Kategori"
        icon={FolderOpen}
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
            </div>
        )}
    />
}
