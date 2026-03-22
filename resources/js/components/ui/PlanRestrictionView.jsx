import React from 'react'
import { XCircle } from 'lucide-react'

export default function PlanRestrictionView({ featureName }) {
    return (
        <div className="p-12 text-center max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm mt-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6 scale-in-center">
                <XCircle size={40} className="text-red-500" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-black text-2xl mb-3 tracking-tight">Erişim Kısıtlandı</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 font-medium">
                {featureName} özelliği paketinizde bulunmamaktadır. <br className="hidden sm:block" />
                Lütfen hizmetten yararlanmak için paketinizi yükseltiniz.
            </p>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Mevcut Durum</p>
                <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">Özellik şu anki planınızda devre dışı bırakılmış.</p>
            </div>
        </div>
    )
}
