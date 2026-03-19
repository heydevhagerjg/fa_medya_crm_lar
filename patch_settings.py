import sys

path = r'c:\Famedya_Crm\fa_medya_crm_laravel\resources\js\pages\SettingsPage.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add hasPermission
old_line = 'const location = useLocation()'
new_lines = '''const location = useLocation()
    const { user } = useAuthStore()
    const hasPermission = (p) => {
        if (!p) return true;
        if (user?.role === "ADMIN") return true;
        return user?.permissions?.includes(p) || false;
    }'''

content = content.replace(old_line, new_lines)

# Add permissions to tabs
content = content.replace("exact: true }", "exact: true, permission: 'settings.view' }")
content = content.replace("label: 'Durumlar', icon: Tag }", "label: 'Durumlar', icon: Tag, permission: 'settings.view' }")
content = content.replace("label: 'Adım Şablonları', icon: List }", "label: 'Adım Şablonları', icon: List, permission: 'settings.view' }")
content = content.replace("label: 'Kullanıcı Yönetimi', icon: Users }", "label: 'Kullanıcı Yönetimi', icon: Users, permission: 'users.manage' }")
content = content.replace("label: 'Rol Yönetimi', icon: Shield }", "label: 'Rol Yönetimi', icon: Shield, permission: 'settings.manage' }")
content = content.replace("label: 'Randevu Başlıkları', icon: Type }", "label: 'Randevu Başlıkları', icon: Type, permission: 'settings.view' }")
content = content.replace("icon: FolderOpen }", "icon: FolderOpen, permission: 'settings.view' }") # Note: might match multiple, caution
content = content.replace("icon: Wallet }", "icon: Wallet, permission: 'settings.manage' }")
content = content.replace("label: 'S3 Ayarları', icon: Cloud }", "label: 'S3 Ayarları', icon: Cloud, permission: 'settings.manage' }")
content = content.replace("label: 'API Anahtarları', icon: Key }", "label: 'API Anahtarları', icon: Key, permission: 'settings.manage' }")
content = content.replace("label: 'Özel İmport Keyler', icon: Lock }", "label: 'Özel İmport Keyler', icon: Lock, permission: 'settings.manage' }")

# Update map
content = content.replace("tabs.map", "tabs.filter(t => hasPermission(t.permission)).map")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
