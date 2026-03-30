import GenericCrudTab from './Shared/GenericCrudTab.jsx'
import { FolderOpen } from 'lucide-react'

export default function ExpenseCategoriesTab() {
    return <GenericCrudTab
        queryKey="expense-categories" apiPath="/settings/expense-categories" label="Kategori"
        pageTitle="Gider Kategorileri"
        icon={FolderOpen}
        emptyForm={{ name: '' }}
        renderForm={(form, setForm) => (
            <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">Kategori Adı *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="theme-input" />
            </div>
        )}
    />
}
