// ========================================
// FUNDOS.JS - Versão Melhorada 2026
// ========================================

let allFunds = [];
let currentFilter = 'all';
let isSearchActive = false;
let currentSort = 'price-desc'; // estado da ordenação ativa

const DISPLAY_LIMIT = 40; // exibe 40 inicialmente

const MAIN_FIIS = [
    // Top FIIs – Logística & Renda
    'HGLG11','KNRI11','MXRF11','VISC11','PVBI11','XPML11','BTLG11','KNCR11','GGRC11','RBRR11',
    // Shopping & Varejo
    'HGRU11','MALL11','TRXF11','BRCR11','RECT11','ALZR11','JSRE11','RBVA11','VILG11','VINO11',
    // Escritórios & Comercial
    'CSHD11','RZAM11','XYZA11','MFFC11','HRSA11','XYZA11','TRTL11','ABCP11','HFCL11','VRLT11',
    // Renda & Diversificado
    'XRPP11','RBGS11','HSAF11','BNFS11','TXCO11','RRPF11','HFCP11','ABRO11','PLAF11','MMFF11',
    // Hospitais & Saúde
    'HAPT11','HSPI11','HSAF11','BCFF11','BCFE11','BCDS11','MVCO11','HSSH11','RCPH11','PCAF11',
    // Ativos & Mortgage
    'MFCM11','VPDI11','MFFI11','XBXL11','BRPR11','BRQM11','BRYO11','BRCA11','BCXS11','BVES11',
    // Infraestrutura
    'INFI11','VFST11','XMPT11','VPTS11','HPFI11','BRPR11','BRCA11','BCFE11','BRYO11','BCDS11',
    // Fundos de Fundos
    'FFIE11','FFDI11','FFCI11','FFAI11','FFBI11','VFDS11','AFFI11','BFII11','CFII11','DFII11',
    // Residencial
    'RZAM11','MFCP11','MFCL11','MFCN11','MFCO11','HFCP11','HFCL11','HFCM11','HFCN11','HFCO11',
    // Extras & Emergentes
    'XPML11','MALL11','HGLG11','KNRI11','MXRF11','VISC11','PVBI11','BTLG11','KNCR11','GGRC11'
];

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadFunds();
    setupFilters();
    setupSortButtons();
    setupModal();
    setupSearch();
    setupFavoritesTab();
});

// ========================================
// BOTÕES DE ORDENAÇÃO (Maior / Menor Valor)
// ========================================
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    if (sortButtons.length === 0) return;

    sortButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentSort = this.dataset.sort;

            const ordenados = ordenarAtivos(allFunds);
            renderFunds(ordenados.slice(0, DISPLAY_LIMIT));
        });
    });
}

function ordenarAtivos(ativos) {
    const copia = [...ativos];
    if (currentSort === 'price-asc') {
        copia.sort((a, b) => a.price - b.price);
    } else {
        copia.sort((a, b) => b.price - a.price);
    }
    return copia;
}

// ========================================
// BUSCA FUNCIONAL
// ========================================
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (!searchInput) return;

    // 1. BUSCA LIVE: Filtra enquanto o usuário digita
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toUpperCase();
        
        if (query.length === 0) {
            limparBusca();
            return;
        }

        // Filtra instantaneamente o que já temos na memória (allStocks ou allFunds)
        // Usamos allStocks para ações e allFunds para fundos
        const baseDeDados = typeof allStocks !== 'undefined' ? allStocks : allFunds;
        const renderizador = typeof renderStocks !== 'undefined' ? renderStocks : renderFunds;

        const matches = baseDeDados.filter(item => 
            item.symbol.toUpperCase().includes(query) || 
            item.name.toUpperCase().includes(query)
        );

        if (matches.length > 0) {
            isSearchActive = true;
            renderizador(matches);
        }
        // Nota: Se não houver matches locais, não fazemos nada no 'input' 
        // para não sobrecarregar a API a cada letra digitada.
    });

    // 2. BUSCA GLOBAL: Quando clica ou dá Enter, busca fora do Top 20
    if (searchBtn) {
        searchBtn.addEventListener('click', () => realizarBusca());
    }

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            realizarBusca();
            searchInput.blur(); // Fecha o teclado no mobile
        }
    });
}
window.realizarBusca = realizarBusca;
window.limparBusca = limparBusca;
// ========================================
// BUSCA GLOBAL E FUNCIONAL (FUNDOS)
// ========================================

async function realizarBusca() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const query = searchInput.value.trim().toUpperCase();
    
    // Se o campo estiver vazio, limpa e volta ao estado inicial
    if (!query) {
        limparBusca();
        return;
    }
    
    const grid = document.getElementById('funds-grid');
    if (grid) grid.innerHTML = '<div class="loading">Buscando fundo no mercado total...</div>';
    
    try {
        // 1. BUSCA LOCAL: Filtra no array de fundos já carregados (Top 20)
        // Busca tanto pelo Ticker (HGLG11) quanto pelo Nome (CSHG Logística)
        const matchesLocais = allFunds.filter(fund => 
            (fund.symbol && fund.symbol.toUpperCase().includes(query)) || 
            (fund.name && fund.name.toUpperCase().includes(query))
        );

        if (matchesLocais.length > 0) {
            isSearchActive = true;
            renderFunds(matchesLocais);
            return; 
        }

        // 2. BUSCA EXTERNA: Usa a API unificada do config.js para buscar fora do Top 20
        const resultado = await buscarAtivo(query); 
        
        if (resultado && resultado.data) {
            isSearchActive = true;
            
            // Mapeia o resultado bruto da API para o formato de Fundo
            const fundoMapeado = mapearAtivoParaFund(resultado.data);
            
            // Adiciona ao array principal para permitir filtros futuros
            if (!allFunds.find(f => f.symbol === fundoMapeado.symbol)) {
                allFunds.push(fundoMapeado);
            }
            
            renderFunds([fundoMapeado]);
        } else {
            // Layout de "Não encontrado"
            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <p style="font-size: 1.2rem; color: var(--text-secondary);">
                            ❌ Fundo ou Administradora "${query}" não encontrado
                        </p>
                        <button class="filter-btn" onclick="limparBusca()" style="margin-top: 20px;">
                            Voltar para listagem completa
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Erro na busca remota:', error);
        if (grid) grid.innerHTML = '<div class="error">Erro ao conectar com o mercado.</div>';
    }
}

function limparBusca() {
    // 1. Limpa o texto do input
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // 2. Reseta estados de controle
    isSearchActive = false;
    currentFilter = 'all';

    // 3. Reseta visualmente os botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') btn.classList.add('active');
    });
    
    // 4. Restaura a exibição com ordenação atual e limite
    if (allFunds && allFunds.length > 0) {
        const ordenados = ordenarAtivos(allFunds);
        renderFunds(ordenados.slice(0, DISPLAY_LIMIT));
    } else {
        loadFunds();
    }
}

// Expõe as funções globalmente para o onclick do HTML funcionar
window.realizarBusca = realizarBusca;
window.limparBusca = limparBusca;
// ========================================
// CARREGAMENTO DE FUNDOS
// ========================================
async function loadFunds() {
    const grid = document.getElementById('funds-grid');
    if (grid) grid.innerHTML = '<div class="loading">Carregando fundos imobiliários...</div>';

    try {
        const dados = await buscarFundos(MAIN_FIIS, '1d');
        
        if (dados && dados.length > 0) {
            allFunds = dados.map(fund => mapearAtivoParaFund(fund));
            const ordenados = ordenarAtivos(allFunds);
            renderFunds(ordenados.slice(0, DISPLAY_LIMIT));
        } else {
            throw new Error('Nenhum dado retornado');
        }
    } catch (error) {
        console.error('Erro ao carregar fundos:', error);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <p style="color: var(--danger);">Erro ao carregar dados. Verifique sua conexão.</p>
                </div>
            `;
        }
    }
}

function mapearAtivoParaFund(fund) {
    return {
        symbol: fund.symbol,
        name: fund.longName || fund.shortName || fund.symbol,
        logourl: getLogoWithFallback(fund.logourl, fund.symbol, 'fund'),
        price: fund.regularMarketPrice || 0,
        change: fund.regularMarketChange || 0,
        changePercent: fund.regularMarketChangePercent || 0,
        volume: fund.regularMarketVolume || 0,
        high: fund.regularMarketDayHigh || 0,
        low: fund.regularMarketDayLow || 0,
        marketCap: fund.marketCap || 0,
        type: 'fundo'
    };
}

// ========================================
// RENDERIZAÇÃO COM FAVORITOS
// ========================================
function renderFunds(funds) {
    const grid = document.getElementById('funds-grid');
    if (!grid) return;

    grid.innerHTML = funds.map(fund => {
        const isFav = FavoritosManager.isFavorito(fund.symbol);
        
        return `
            <div class="asset-card">
                <div class="asset-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${fund.logourl}" 
                             alt="${fund.symbol}" 
                             class="asset-logo-img" 
                             width="40" height="40">
                             
                        <div>
                            <div class="asset-symbol">${fund.symbol}</div>
                            <div class="asset-name">${fund.name}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="favorite-btn ${isFav ? 'active' : ''}" 
                                onclick="toggleFavorito(event, '${fund.symbol}')"
                                title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                            ${isFav ? '★' : '☆'}
                        </button>
                        <span class="badge ${fund.changePercent >= 0 ? 'badge-success' : 'badge-danger'}">
                            ${fund.changePercent >= 0 ? '▲' : '▼'} ${Math.abs(fund.changePercent).toFixed(2)}%
                        </span>
                    </div>
                </div>
                
                <div class="asset-price" onclick="showDetails('${fund.symbol}')" style="cursor: pointer;">
                    R$ ${fund.price.toFixed(2)}
                </div>
                
                <div class="asset-change ${fund.change >= 0 ? 'positive' : 'negative'}" 
                     onclick="showDetails('${fund.symbol}')" style="cursor: pointer;">
                    <span>R$ ${Math.abs(fund.change).toFixed(2)}</span>
                </div>
                
                <div class="asset-info" onclick="showDetails('${fund.symbol}')" style="cursor: pointer;">
                    <div class="info-item">
                        <div class="info-label">Volume</div>
                        <div class="info-value">${formatarVolume(fund.volume)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Máx/Mín</div>
                        <div class="info-value">${fund.high.toFixed(2)} / ${fund.low.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// MODAL DE DETALHES MELHORADO
// ========================================
async function showDetails(symbol) {
    const modal = document.getElementById('fund-modal');
    const content = document.getElementById('modal-details');

    modal.classList.add('active');
    content.innerHTML = '<div class="loading">Carregando informações detalhadas...</div>';

    try {
        const fund = await buscarDetalheFundo(symbol);
        
        if (!fund) {
            content.innerHTML = '<p style="color: var(--danger);">Erro ao carregar detalhes</p>';
            return;
        }

        const dividendos = fund.dividendsData && Array.isArray(fund.dividendsData) 
            ? fund.dividendsData.slice(0, 5) 
            : [];

        const isFav = FavoritosManager.isFavorito(symbol);

        content.innerHTML = `
            <div class="modal-header-detail">
                <img src="${getLogoWithFallback(fund.logourl, fund.symbol, 'fund')}" 
                     width="60" 
                     style="border-radius: 8px;"
                     onerror="this.src='https://s3-symbol-logo.tradingview.com/brasil-bolsa-balcao--big.svg'">
                <div>
                    <h2>${fund.symbol}</h2>
                    <p style="color: var(--text-secondary);">${fund.longName || fund.shortName}</p>
                </div>
                <button class="favorite-btn-large ${isFav ? 'active' : ''}" 
                        onclick="toggleFavoritoModal(event, '${fund.symbol}')"
                        title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                    ${isFav ? '★' : '☆'} ${isFav ? 'Favoritado' : 'Favoritar'}
                </button>
            </div>

            <div class="modal-stats">
                <div class="stat-box">
                    <strong>Preço Atual</strong>
                    <span style="font-size: 1.5rem; color: var(--primary);">
                        R$ ${fund.regularMarketPrice.toFixed(2)}
                    </span>
                </div>
                <div class="stat-box ${fund.regularMarketChangePercent >= 0 ? 'positive' : 'negative'}">
                    <strong>Variação</strong>
                    <span style="font-size: 1.2rem;">
                        ${fund.regularMarketChangePercent >= 0 ? '▲' : '▼'} 
                        ${Math.abs(fund.regularMarketChangePercent).toFixed(2)}%
                    </span>
                </div>
                <div class="stat-box">
                    <strong>Volume</strong>
                    <span>${formatarVolume(fund.regularMarketVolume)}</span>
                </div>
                <div class="stat-box">
                    <strong>Máxima do Dia</strong>
                    <span>R$ ${fund.regularMarketDayHigh.toFixed(2)}</span>
                </div>
                <div class="stat-box">
                    <strong>Mínima do Dia</strong>
                    <span>R$ ${fund.regularMarketDayLow.toFixed(2)}</span>
                </div>
                <div class="stat-box">
                    <strong>Patrimônio</strong>
                    <span>${formatarMarketCap(fund.marketCap)}</span>
                </div>
            </div>

            ${fund.longBusinessSummary ? `
                <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">Sobre o Fundo</h3>
                    <p style="line-height: 1.6; color: var(--text-secondary);">
                        ${fund.longBusinessSummary}
                    </p>
                </div>
            ` : ''}

            ${dividendos.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h3>Últimos Rendimentos</h3>
                    <table class="data-table" style="width: 100%; margin-top: 10px;">
                        <thead>
                            <tr>
                                <th style="text-align: left;">Data</th>
                                <th style="text-align: center;">Tipo</th>
                                <th style="text-align: right;">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dividendos.map(div => `
                                <tr>
                                    <td>${new Date(div.paymentDate).toLocaleDateString('pt-BR')}</td>
                                    <td style="text-align: center;">
                                        <span class="badge badge-info">Rendimento</span>
                                    </td>
                                    <td style="text-align: right;" class="text-success">
                                        ${formatarMoeda(div.assetIssuedDividend)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            <div style="margin-top: 20px; text-align: center;">
                <p style="font-size: 0.9rem; color: var(--text-secondary);">
                    Última atualização: ${new Date().toLocaleString('pt-BR')}
                </p>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        content.innerHTML = '<p style="color: var(--danger);">Erro ao carregar detalhes do fundo</p>';
    }
}

// ========================================
// SISTEMA DE FAVORITOS
// ========================================
function toggleFavorito(event, symbol) {
    event.stopPropagation();
    
    const fund = allFunds.find(f => f.symbol === symbol);
    if (!fund) return;
    
    const adicionado = FavoritosManager.toggleFavorito(fund);
    
    const btn = event.currentTarget;
    if (adicionado) {
        btn.classList.add('active');
        btn.innerHTML = '★';
        btn.title = 'Remover dos favoritos';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '☆';
        btn.title = 'Adicionar aos favoritos';
    }
    
    if (currentFilter === 'favorites') {
        showFavorites();
    }
}

function toggleFavoritoModal(event, symbol) {
    event.stopPropagation();
    
    const fund = allFunds.find(f => f.symbol === symbol);
    if (!fund) return;
    
    FavoritosManager.toggleFavorito(fund);
    
    const modal = document.getElementById('fund-modal');
    modal.classList.remove('active');
    
    setTimeout(() => {
        showDetails(symbol);
    }, 300);
}

function setupFavoritesTab() {
    const filterContainer = document.querySelector('.filter-container');
    if (!filterContainer) return;
    
    const favBtn = document.createElement('button');
    favBtn.className = 'filter-btn';
    favBtn.setAttribute('data-filter', 'favorites');
    favBtn.innerHTML = '★ Favoritos';
    favBtn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = 'favorites';
        showFavorites();
    });
    
    filterContainer.appendChild(favBtn);
}

function showFavorites() {
    const favoritos = FavoritosManager.obterFavoritos().filter(f => f.type === 'fundo');
    
    if (favoritos.length === 0) {
        const grid = document.getElementById('funds-grid');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="font-size: 1.5rem;">⭐</p>
                <p style="font-size: 1.2rem; color: var(--text-secondary); margin-top: 10px;">
                    Nenhum fundo favoritado ainda
                </p>
                <p style="color: var(--text-secondary); margin-top: 10px;">
                    Clique na estrela (☆) nos fundos para adicioná-los aos favoritos
                </p>
            </div>
        `;
        return;
    }
    
    const symbols = favoritos.map(f => f.symbol);
    loadFavoritesData(symbols);
}

async function loadFavoritesData(symbols) {
    const grid = document.getElementById('funds-grid');
    grid.innerHTML = '<div class="loading">Carregando favoritos...</div>';
    
    try {
        const dados = await buscarFundos(symbols, '1d');
        
        if (dados && dados.length > 0) {
            const funds = dados.map(fund => mapearAtivoParaFund(fund));
            renderFunds(funds);
        }
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--danger);">Erro ao carregar favoritos</p>
            </div>
        `;
    }
}

// ========================================
// FILTROS
// ========================================
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.filter === 'favorites') return;
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            isSearchActive = false;
            applyFilter();
        });
    });
}

async function applyFilter() {
    const grid = document.getElementById('funds-grid');
    
    if (currentFilter === 'all') {
        const ordenados = ordenarAtivos(allFunds);
        renderFunds(ordenados.slice(0, DISPLAY_LIMIT));
        return;
    }

    if (grid) grid.innerHTML = '<div class="loading">Buscando maiores variações de FIIs...</div>';

    try {
        // Para FIIs, a Brapi usa o mesmo endpoint, mas filtramos tickers que terminam em 11
        let direcao = currentFilter === 'low' ? 'asc' : 'desc';
        let criterio = currentFilter === 'volume' ? 'volume' : 'change';
        
        const todosNoRanking = await buscarRankingMercado(criterio, direcao);
        
        // Filtra apenas os que são Fundos (geralmente terminam com 11)
        const apenasFIIs = todosNoRanking.filter(t => t.endsWith('11')).slice(0, 20);
        
        const dadosDetalhados = await buscarAcoesBR(apenasFIIs);
        const fundsMapeados = dadosDetalhados.map(f => mapearAtivoParaFund(f));
        renderFunds(fundsMapeados);
    } catch (error) {
        console.error('Erro nos filtros de FIIs:', error);
    }
}

// ========================================
// MODAL
// ========================================
function setupModal() {
    const modal = document.getElementById('fund-modal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
    }
    
    window.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };
}

// ========================================
// AUTO-REFRESH
// ========================================
setInterval(() => {
    if (!isSearchActive && currentFilter !== 'favorites') {
        loadFunds();
    } else if (currentFilter === 'favorites') {
        const favoritos = FavoritosManager.obterFavoritos().filter(f => f.type === 'fundo');
        if (favoritos.length > 0) {
            loadFavoritesData(favoritos.map(f => f.symbol));
        }
    }
}, 60000);
