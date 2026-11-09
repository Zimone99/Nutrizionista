
export default [
    {
        label: 'MENU PRINCIPALE',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-home',
                to: '/admin'
            },
            {
                label: 'Pazienti',
                icon: 'pi pi-users',
                to: '/admin/pazienti'
            },
            {
                label: 'Appuntamenti',
                icon: 'pi pi-calendar',
                to: '/admin/appuntamenti'
            },
            {
                label: 'Cartelle nutrizionali',
                icon: 'pi pi-folder',
                to: '/admin/cartelle'
            },
            {
                label: 'Report',
                icon: 'pi pi-chart-bar',
                to: '/admin/report'
            }
        ]
    }
]
