import { useState } from 'react'
import { Moon, Sun, Palette } from 'lucide-react'
import { useThemeStore } from '../../stores/index.js'
import SettingsPageHeader from './Shared/SettingsPageHeader.jsx'

export default function ThemeTab() {
    const { theme, palette, toggleTheme, setPalette, availablePalettes } = useThemeStore()

    const paletteInfo = {
        violet: { name: 'Violet', desc: 'Modern SaaS', color: '#905EFC' },
        ocean: { name: 'Ocean', desc: 'Kurumsal', color: '#0f766e' },
        graphite: { name: 'Graphite', desc: 'Premium Minimal', color: '#d97706' }
    }

    return (
        <div className="space-y-5 max-w-3xl">
            <SettingsPageHeader title="Tema" />

            {/* Appearance Mode Section */}
            <div className="theme-surface border theme-divider rounded-xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.06]">
                    <Sun size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-[#905EFC]/10 rounded-lg text-[#905EFC]">
                            <Sun size={14} />
                        </div>
                        <h3 className="text-sm font-black theme-text-primary uppercase tracking-wider">Görünüş Modu</h3>
                    </div>

                    <p className="text-[13px] theme-text-secondary mb-4">
                        Arayüzün açık veya koyu renklerle gösterilmesini seçin.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (theme !== 'light') toggleTheme()
                            }}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-semibold text-sm transition-all ${
                                theme === 'light'
                                    ? 'bg-[#905EFC] text-white shadow-lg shadow-[#905EFC]/20'
                                    : 'bg-[#F4F5F7] dark:bg-white/5 border theme-divider theme-text-primary hover:border-[#905EFC]'
                            }`}
                        >
                            <Sun size={20} />
                            <span>Açık Mod</span>
                        </button>
                        <button
                            onClick={() => {
                                if (theme !== 'dark') toggleTheme()
                            }}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-semibold text-sm transition-all ${
                                theme === 'dark'
                                    ? 'bg-[#905EFC] text-white shadow-lg shadow-[#905EFC]/20'
                                    : 'bg-[#F4F5F7] dark:bg-white/5 border theme-divider theme-text-primary hover:border-[#905EFC]'
                            }`}
                        >
                            <Moon size={20} />
                            <span>Koyu Mod</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Color Palette Section */}
            <div className="theme-surface border theme-divider rounded-xl p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.06]">
                    <Palette size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-[#905EFC]/10 rounded-lg text-[#905EFC]">
                            <Palette size={14} />
                        </div>
                        <h3 className="text-sm font-black theme-text-primary uppercase tracking-wider">Renk Paleti</h3>
                    </div>

                    <p className="text-[13px] theme-text-secondary mb-6">
                        Uygulamanın ana renk semasını seçin. Seçiminiz tüm bileşenlerde otomatik olarak uygulanacaktır.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {availablePalettes.map((p) => {
                            const info = paletteInfo[p]
                            
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPalette(p)}
                                    className={`p-5 rounded-xl border-2 transition-all group cursor-pointer ${
                                        palette === p
                                            ? 'border-[#905EFC] bg-[#905EFC]/5 dark:bg-[#905EFC]/10 ring-2 ring-[#905EFC]/20'
                                            : 'theme-divider bg-[#F4F5F7] dark:bg-white/5 hover:border-[#905EFC] hover:bg-[#905EFC]/2.5'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <div 
                                                className="w-10 h-10 rounded-lg shadow-md transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: info.color }}
                                            ></div>
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-sm theme-text-primary">{info.name}</div>
                                            <div className="text-[11px] theme-text-secondary mb-3">{info.desc}</div>
                                            {palette === p && (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#905EFC]/10 dark:bg-[#905EFC]/20 text-[#905EFC] rounded-lg text-[10px] font-bold uppercase tracking-wide">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Seçili
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="theme-surface border theme-divider rounded-xl p-6">
                <h3 className="text-sm font-bold theme-text-primary mb-4">Tema Önizlemesi</h3>
                
                <div className="space-y-3">
                    {/* Primary Button Preview */}
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold theme-text-secondary w-24">Ana Düğme:</span>
                        <button className="px-4 py-2 bg-[#905EFC] hover:bg-[#7B4FD4] text-white rounded-lg text-sm font-bold transition-colors">
                            Kaydet
                        </button>
                    </div>

                    {/* Text Preview */}
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold theme-text-secondary w-24">Ana Yazı:</span>
                        <span className="text-[13px] font-medium theme-text-primary">Tema ayarlarınız otomatik olarak kaydedilir.</span>
                    </div>

                    {/* Border Preview */}
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold theme-text-secondary w-24">Sınır:</span>
                        <div className="w-32 h-12 border-2 theme-divider rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-[#905EFC]/5 dark:bg-[#905EFC]/10 border border-[#905EFC]/20 dark:border-[#905EFC]/30 rounded-xl p-4">
                <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-[#905EFC]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-[12px] theme-text-secondary">
                        <strong>İpucu:</strong> Tema seçimleri otomatik olarak kaydedilir ve tüm cihazlarınızda senkronize edilir. Hiçbir şey kaydetmenize gerek yok!
                    </p>
                </div>
            </div>
        </div>
    )
}
