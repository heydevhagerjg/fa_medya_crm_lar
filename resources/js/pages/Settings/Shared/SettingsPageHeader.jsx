import PageHeader from '../../../components/layout/PageHeader.jsx'

export default function SettingsPageHeader({
    title,
    actions = [],
    children,
    childrenPlacement = 'below',
}) {
    return (
        <PageHeader
            title={title}
            breadcrumbs={['Ayarlar', title]}
            actions={actions}
            childrenPlacement={childrenPlacement}
        >
            {children}
        </PageHeader>
    )
}
