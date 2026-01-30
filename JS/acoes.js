// ========== AÇÕES PAGE SCRIPTS ==========

let todasAcoes = [];
let periodo = '1d';

// ========== CARREGAR AÇÕES ==========
async function carregarAcoes() {
    try {
        // Ações Brasileiras
        const acoesBR = await buscarAcoesBR([
            'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3',
            'MGLU3', 'B3SA3', 'RENT3', 'SUZB3', 'LREN3'
        ]);
        
        // BDRs
        const bdrs = await buscarAcoesBR([
            'AAPL34', 'GOGL34', 'MSFT34', 'AMZO34', 'TSLA34'
        ]);
        
        // ETFs
        const etfs = await buscarAcoesBR([
            'BOVA11', 'IVVB11', 'SMAL11', 'PIBB11'
        ]);
        
        if (acoesBR) renderizarAcoes('acoes-brasileiras', acoesBR);
        if (bdrs) renderizarAcoes('bdrs', bdrs);
        if (etfs) renderizarAcoes('etfs', etfs);
        
        // Armazenar para filtros
        todasAcoes = [
            ...(acoesBR || []),
            ...(bdrs || []),
            ...(etfs || [])
        ];
        
    } catch (error) {
        console.error('Erro ao carregar ações:', error);
        mostrarErro();
    }
}

// ========== RENDERIZAR AÇÕES NA TABELA ==========
function renderizarAcoes(tbodyId, acoes) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    if (!acoes || acoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Nenhum dado disponível</td></tr>';
        return;
    }
    
    tbody.innerHTML = acoes.map(acao => {
        const change = acao.regularMarketChangePercent || 0;
        const volume = acao.regularMarketVolume || 0;
        
        return `
            <tr 
                data-ticker="${acao.symbol}" 
                data-change="${change}" 
                data-volume="${volume}"
                onclick="abrirModalAtivo('${acao.symbol}')"
                style="cursor: pointer;"
            >
                <td>
                    <div class="symbol">${acao.symbol}</div>
                    <div class="asset-name">${acao.shortName || acao.longName || ''}</div>
                </td>
                <td class="price">${formatarMoeda(acao.regularMarketPrice)}</td>
                <td style="text-align: right;">
                    <span class="${obterClasseVariacao(change)}">
                        <span class="change-arrow">${obterSeta(change)}</span>
                        <span class="badge ${change >= 0 ? 'badge-success' : 'badge-danger'}">
                            ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                        </span>
                    </span>
                </td>
                <td style="text-align: right;" class="text-muted">
                    ${formatarNumero(volume, 0)}
                </td>
            </tr>
        `;
    }).join('');
}

// ========== BUSCA EM TEMPO REAL ==========
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const allRows = document.querySelectorAll('.data-table tbody tr');
        
        allRows.forEach(row => {
            const ticker = row.querySelector('.symbol')?.textContent.toLowerCase() || '';
            const name = row.querySelector('.asset-name')?.textContent.toLowerCase() || '';
            
            if (ticker.includes(searchTerm) || name.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// ========== FILTROS ==========
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active de todos
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        aplicarFiltro(filter);
    });
});

function aplicarFiltro(filter) {
    const allRows = document.querySelectorAll('.data-table tbody tr');
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const rowsArray = Array.from(allRows);
    
    // Remover todos os estilos de ordenação
    rowsArray.forEach(row => {
        row.style.order = '';
        row.style.display = '';
    });
    
    if (filter === 'all') {
        return;
    }
    
    if (filter === 'maiores-altas') {
        const sorted = rowsArray
            .filter(row => row.dataset.ticker)
            .sort((a, b) => {
                const changeA = parseFloat(a.dataset.change || 0);
                const changeB = parseFloat(b.dataset.change || 0);
                return changeB - changeA;
            });
        
        sorted.forEach((row, index) => {
            const change = parseFloat(row.dataset.change || 0);
            if (change > 0 && index < 10) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    } else if (filter === 'maiores-baixas') {
        const sorted = rowsArray
            .filter(row => row.dataset.ticker)
            .sort((a, b) => {
                const changeA = parseFloat(a.dataset.change || 0);
                const changeB = parseFloat(b.dataset.change || 0);
                return changeA - changeB;
            });
        
        sorted.forEach((row, index) => {
            const change = parseFloat(row.dataset.change || 0);
            if (change < 0 && index < 10) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    } else if (filter === 'maior-volume') {
        const sorted = rowsArray
            .filter(row => row.dataset.ticker)
            .sort((a, b) => {
                const volA = parseFloat(a.dataset.volume || 0);
                const volB = parseFloat(b.dataset.volume || 0);
                return volB - volA;
            });
        
        sorted.forEach((row, index) => {
            if (index < 10) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

// ========== SELETOR DE PERÍODO ==========
const periodButtons = document.querySelectorAll('.period-btn');
periodButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        periodButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        periodo = this.dataset.period;
        carregarAcoes(); // Recarregar com novo período
    });
});

// ========== MOSTRAR ERRO ==========
function mostrarErro() {
    const tabelas = ['acoes-brasileiras', 'bdrs', 'etfs'];
    tabelas.forEach(id => {
        const tbody = document.getElementById(id);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--accent-danger);">Erro ao carregar dados. Tente novamente mais tarde.</td></tr>';
        }
    });
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async function() {
    await carregarAcoes();
    
    // Atualizar a cada 60 segundos
    setInterval(carregarAcoes, 60000);
});
