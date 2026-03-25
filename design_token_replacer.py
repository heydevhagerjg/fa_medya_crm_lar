import os

files = [
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\BackupTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\UsersTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\RolesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\AuditLogTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\ApiKeysTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\WorkflowsTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\StatusesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\ServicesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\TemplatesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\ExpenseCategoriesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\CashRegistersTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\AppointmentTitlesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\ServiceTrackingCategoriesTab.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\Shared\StatusItem.jsx',
    r'C:\Famedya_Crm\fa_medya_crm_lar\resources\js\pages\Settings\Shared\GenericCrudTab.jsx',
]

replacements = [
    ('bg-indigo-600', 'bg-[#905EFC]'),
    ('hover:bg-indigo-700', 'hover:bg-[#7B4FD4]'),
    ('bg-indigo-700', 'bg-[#7B4FD4]'),
    ('text-indigo-600', 'text-[#905EFC]'),
    ('text-indigo-500', 'text-[#905EFC]'),
    ('text-indigo-400', 'text-[#905EFC]'),
    ('hover:text-indigo-600', 'hover:text-[#905EFC]'),
    ('dark:text-indigo-400', 'dark:text-[#905EFC]'),
    ('focus:border-indigo-500', 'focus:border-[#905EFC]'),
    ('border-indigo-500', 'border-[#905EFC]'),
    ('focus:ring-indigo-500', 'focus:ring-[#905EFC]'),
    ('shadow-indigo-500/30', 'shadow-[#905EFC]/20'),
    ('shadow-indigo-500/20', 'shadow-[#905EFC]/20'),
    ('group-hover:bg-indigo-500/10', 'group-hover:bg-[#905EFC]/10'),
    ('group-hover:bg-indigo-50', 'group-hover:bg-[#905EFC]/10'),
    ('group-hover:text-indigo-600', 'group-hover:text-[#905EFC]'),
    ('hover:bg-indigo-500/10', 'hover:bg-[#905EFC]/10'),
    ('hover:bg-indigo-50', 'hover:bg-[#905EFC]/10'),
    ('hover:text-indigo-500', 'hover:text-[#905EFC]'),
    ('bg-indigo-500/10', 'bg-[#905EFC]/10'),
    ('bg-indigo-50', 'bg-[#905EFC]/10'),
    ('dark:bg-indigo-500/10', 'dark:bg-[#905EFC]/10'),
    ('dark:bg-indigo-900/30', 'dark:bg-[#905EFC]/10'),
    ('ring-indigo-500/20', 'ring-[#905EFC]/20'),
    ('border-indigo-100', 'border-[#905EFC]/20'),
    ('bg-indigo-100', 'bg-[#905EFC]/20'),
    ('text-indigo-100', 'text-white/80'),
    ('dark:bg-gray-900', 'dark:bg-[#111111]'),
    ('dark:bg-gray-800', 'dark:bg-white/5'),
    ('dark:bg-gray-700', 'dark:bg-white/10'),
    ('dark:border-gray-800', 'dark:border-white/5'),
    ('dark:border-gray-700', 'dark:border-white/10'),
    ('dark:border-gray-600', 'dark:border-white/10'),
    ('border-gray-100', 'border-[#E5E9F0]'),
    ('border-gray-200', 'border-[#E5E9F0]'),
    ('border-gray-300', 'border-[#E5E9F0]'),
    ('text-gray-900', 'text-[#1A1A2E]'),
    ('text-gray-800', 'text-[#1A1A2E]'),
    ('text-gray-700', 'text-[#1A1A2E]'),
    ('text-gray-600', 'text-[#9097A6]'),
    ('text-gray-500', 'text-[#9097A6]'),
    ('text-gray-400', 'text-[#9097A6]'),
    ('text-gray-300', 'text-[#9097A6]'),
    ('dark:text-gray-400', 'dark:text-[#9097A6]'),
    ('dark:text-gray-300', 'dark:text-white'),
    ('dark:text-gray-200', 'dark:text-white'),
    ('bg-gray-50', 'bg-[#F4F5F7]'),
    ('bg-gray-100', 'bg-[#E5E9F0]'),
    ('bg-gray-200', 'bg-[#E5E9F0]'),
    ('hover:bg-gray-50', 'hover:bg-[#F4F5F7]'),
    ('hover:bg-gray-100', 'hover:bg-[#E5E9F0]'),
    ('dark:hover:bg-gray-800', 'dark:hover:bg-white/10'),
    ('dark:hover:bg-gray-700', 'dark:hover:bg-white/10'),
    ('dark:divide-gray-800', 'dark:divide-white/5'),
    ('rounded-3xl', 'rounded-xl'),
    ('rounded-2xl', 'rounded-xl'),
]

changed = []
unchanged = []
missing = []

for f in files:
    if not os.path.exists(f):
        missing.append(os.path.basename(f))
        continue
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    original = content
    for src, dst in replacements:
        content = content.replace(src, dst)
    if content != original:
        with open(f, 'w', encoding='utf-8', newline='') as fh:
            fh.write(content)
        changed.append(os.path.basename(f))
    else:
        unchanged.append(os.path.basename(f))

print('CHANGED (%d):' % len(changed), changed)
print('UNCHANGED (%d):' % len(unchanged), unchanged)
print('MISSING (%d):' % len(missing), missing)
