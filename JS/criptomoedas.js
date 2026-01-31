// ========================================
// CRIPTOMOEDAS.JS - Versão Melhorada 2026
// ========================================

let allCryptos = [];
let currentFilter = 'all';
let isSearchActive = false;
let currentSort = 'price-desc'; // estado da ordenação ativa

const DISPLAY_LIMIT = 40; // exibe 40 inicialmente

const MAIN_CRYPTOS = [
    'bitcoin', 'ethereum', 'solana', 'cardano', 'binancecoin',
    'ripple', 'polkadot', 'avalanche-2', 'chainlink', 'uniswap',
    'litecoin', 'stellar', 'polygon', 'near', 'aptos'
];

const CRYPTO_SYMBOLS = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'solana': 'SOL',
    'cardano': 'ADA',
    'binancecoin': 'BNB',
    'ripple': 'XRP',
    'polkadot': 'DOT',
    'avalanche-2': 'AVAX',
    'chainlink': 'LINK',
    'uniswap': 'UNI',
    'litecoin': 'LTC',
    'stellar': 'XLM',
    'polygon': 'MATIC',
    'near': 'NEAR',
    'aptos': 'APT'
};

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCryptos();
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

            const ordenados = ordenarAtivos(allCryptos);
            renderCryptos(ordenados.slice(0, DISPLAY_LIMIT));
        });
    });
}

function ordenarAtivos(ativos) {
    const copia = [...ativos];
    if (currentSort === 'price-asc') {
        copia.sort((a, b) => (a.priceUSD || 0) - (b.priceUSD || 0));
    } else {
        copia.sort((a, b) => (b.priceUSD || 0) - (a.priceUSD || 0));
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

async function realizarBusca() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const query = searchInput.value.trim().toUpperCase();
    if (!query) {
        limparBusca();
        return;
    }
    
    const grid = document.getElementById('cryptos-grid');
    if (grid) grid.innerHTML = '<div class="loading">Buscando no mercado global de criptos...</div>';
    
    try {
        // Tenta a API unificada do config.js
        const resultado = await buscarAtivo(query);
        
        if (resultado && resultado.type === 'cripto') {
            isSearchActive = true;
            // Mapeia o resultado do CoinGecko para o formato do seu card
            const cryptoMapeada = mapearCriptoParaCard(resultado.id, resultado.data);
            
            // Adiciona ao array principal para não sumir ao filtrar
            if (!allCryptos.find(c => c.id === cryptoMapeada.id)) {
                allCryptos.push(cryptoMapeada);
            }
            
            renderCryptos([cryptoMapeada]);
        } else {
            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <p style="font-size: 1.2rem; color: var(--text-secondary);">
                            ❌ Criptomoeda "${query}" não encontrada
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
    }
}

function limparBusca() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    isSearchActive = false;
    currentFilter = 'all';

    // Reseta botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') btn.classList.add('active');
    });

    // Restaura com ordenação atual e limite
    if (allCryptos.length > 0) {
        const ordenados = ordenarAtivos(allCryptos);
        renderCryptos(ordenados.slice(0, DISPLAY_LIMIT));
    } else {
        loadCryptos();
    }
}

// Expõe globalmente para o onclick do HTML
window.realizarBusca = realizarBusca;
window.limparBusca = limparBusca;
// ========================================
// CARREGAMENTO DE CRIPTOMOEDAS
// ========================================
async function loadCryptos() {
    const grid = document.getElementById('cryptos-grid');
    if (grid) grid.innerHTML = '<div class="loading">Carregando mercado global...</div>';

    try {
        // Carregamos as top 50 moedas por padrão para ter uma base rica
        const dados = await buscarRankingCripto('market_cap_desc');
        
        if (dados) {
            // Mapeamos os dados (a CoinGecko retorna um array de objetos aqui)
            allCryptos = dados.map(item => mapearCriptoParaCard(item.id, {
                usd: item.current_price,
                brl: item.current_price * 5.0, // Conversão estimada ou use API de câmbio
                usd_24h_change: item.price_change_percentage_24h,
                usd_market_cap: item.market_cap,
                usd_24h_vol: item.total_volume,
                image: item.image // Usando a imagem que já vem na lista
            }));
            const ordenados = ordenarAtivos(allCryptos);
            renderCryptos(ordenados.slice(0, DISPLAY_LIMIT));
        }
    } catch (error) {
        console.error('Erro ao carregar criptos:', error);
    }
}

// FILTROS
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
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
  const grid = document.getElementById('cryptos-grid');
  if (!grid) return;

  if (currentFilter === 'all') {
    // TODOS os ativos carregados, ordenação pela seleção atual do sort-btn
    const ordenados = ordenarAtivos(allCryptos);
    renderCryptos(ordenados.slice(0, DISPLAY_LIMIT));
    return;
  }

  grid.innerHTML = '<div class="loading">Analisando tendências globais...</div>';

  let filtrados = [...allCryptos];

  switch (currentFilter) {
    case 'high':
      // Maior alta para menor alta (todas em alta)
      filtrados = filtrados
        .filter(c => c.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h);
      break;
    case 'low':
      // Maior baixa para menor baixa (todas em baixa)
      filtrados = filtrados
        .filter(c => c.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h);
      break;
    case 'volume':
      // Maior volume 24h para menor
      filtrados = filtrados
        .sort((a, b) => b.volume24h - a.volume24h);
      break;
    default:
      break;
  }

  renderCryptos(filtrados.slice(0, DISPLAY_LIMIT));
}

function mapearCriptoParaCard(id, data) {
    const symbol = CRYPTO_SYMBOLS[id] || id.toUpperCase();
    
    return {
        id: id,
        symbol: symbol,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
        // Usa a imagem da API ou o fallback manual que você já tinha
        logourl: data.image || `https://assets.coingecko.com/coins/images/${getCoinImageId(id)}/small/${id}.png`,
        priceUSD: data.usd || 0,
        priceBRL: data.brl || (data.usd * 5), 
        change24h: data.usd_24h_change || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        type: 'cripto'
    };
}

function getCoinImageId(id) {
    const imageIds = {
        'bitcoin': '1',
        'ethereum': '279',
        'solana': '4128',
        'cardano': '975',
        'binancecoin': '825',
        'ripple': '44',
        'polkadot': '12171',
        'avalanche-2': '12559',
        'chainlink': '877',
        'uniswap': '12504',
        'litecoin': '2',
        'stellar': '100',
        'polygon': '4713',
        'near': '10365',
        'aptos': '26455'
    };
    return imageIds[id] || '1';
}

// ========================================
// RENDERIZAÇÃO COM FAVORITOS
// ========================================
function renderCryptos(cryptos) {
    const grid = document.getElementById('cryptos-grid');
    if (!grid) return;

    grid.innerHTML = cryptos.map(crypto => {
        const isFav = FavoritosManager.isFavorito(crypto.symbol);
        
        return `
            <div class="asset-card">
                <div class="asset-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${crypto.logourl}" 
                             alt="${crypto.symbol}" 
                             class="asset-logo-img"
                             
                             width="40" height="40">
                        <div>
                            <div class="asset-symbol">${crypto.symbol}</div>
                            <div class="asset-name">${crypto.name}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="favorite-btn ${isFav ? 'active' : ''}" 
                                onclick="toggleFavorito(event, '${crypto.symbol}')"
                                title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                            ${isFav ? '★' : '☆'}
                        </button>
                        <span class="badge ${crypto.change24h >= 0 ? 'badge-success' : 'badge-danger'}">
                            ${crypto.change24h >= 0 ? '▲' : '▼'} ${Math.abs(crypto.change24h).toFixed(2)}%
                        </span>
                    </div>
                </div>
                
                <div class="asset-price" onclick="showDetails('${crypto.id}')" style="cursor: pointer;">
                    $${formatarNumero(crypto.priceUSD, 2)}
                </div>
                
                <div class="asset-change ${crypto.change24h >= 0 ? 'positive' : 'negative'}" 
                     onclick="showDetails('${crypto.id}')" style="cursor: pointer;">
                    <span>${formatarMoeda(crypto.priceBRL)}</span>
                </div>
                
                <div class="asset-info" onclick="showDetails('${crypto.id}')" style="cursor: pointer;">
                    <div class="info-item">
                        <div class="info-label">Volume 24h</div>
                        <div class="info-value">$${formatarVolume(crypto.volume24h)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Market Cap</div>
                        <div class="info-value">$${formatarVolume(crypto.marketCap)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// MODAL DE DETALHES MELHORADO
// ========================================
async function showDetails(cryptoId) {
    const modal = document.getElementById('crypto-modal');
    const content = document.getElementById('modal-details');

    modal.classList.add('active');
    content.innerHTML = '<div class="loading">Carregando informações detalhadas...</div>';

    try {
        const crypto = await buscarDetalheCripto(cryptoId);
        
        if (!crypto) {
            content.innerHTML = '<p style="color: var(--danger);">Erro ao carregar detalhes</p>';
            return;
        }

        const symbol = crypto.symbol.toUpperCase();
        const isFav = FavoritosManager.isFavorito(symbol);
        const priceChange24h = crypto.market_data.price_change_percentage_24h || 0;
        const priceChange7d = crypto.market_data.price_change_percentage_7d || 0;
        const priceChange30d = crypto.market_data.price_change_percentage_30d || 0;

        content.innerHTML = `
            <div class="modal-header-detail">
                <img src="${crypto.image.small}" 
                     width="60" 
                     style="border-radius: 50%;"
                     onerror="this.src='https://via.placeholder.com/60'">
                <div>
                    <h2>${symbol}</h2>
                    <p style="color: var(--text-secondary);">${crypto.name}</p>
                </div>
                <button class="favorite-btn-large ${isFav ? 'active' : ''}" 
                        onclick="toggleFavoritoModal(event, '${symbol}', '${cryptoId}')"
                        title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                    ${isFav ? '★' : '☆'} ${isFav ? 'Favoritado' : 'Favoritar'}
                </button>
            </div>

            <div class="modal-stats">
                <div class="stat-box">
                    <strong>Preço (USD)</strong>
                    <span style="font-size: 1.5rem; color: var(--primary);">
                        $${formatarNumero(crypto.market_data.current_price.usd, 2)}
                    </span>
                </div>
                <div class="stat-box">
                    <strong>Preço (BRL)</strong>
                    <span style="font-size: 1.2rem; color: var(--primary);">
                        ${formatarMoeda(crypto.market_data.current_price.brl)}
                    </span>
                </div>
                <div class="stat-box ${priceChange24h >= 0 ? 'positive' : 'negative'}">
                    <strong>24h</strong>
                    <span style="font-size: 1.2rem;">
                        ${priceChange24h >= 0 ? '▲' : '▼'} 
                        ${Math.abs(priceChange24h).toFixed(2)}%
                    </span>
                </div>
                <div class="stat-box ${priceChange7d >= 0 ? 'positive' : 'negative'}">
                    <strong>7 dias</strong>
                    <span>
                        ${priceChange7d >= 0 ? '▲' : '▼'} 
                        ${Math.abs(priceChange7d).toFixed(2)}%
                    </span>
                </div>
                <div class="stat-box ${priceChange30d >= 0 ? 'positive' : 'negative'}">
                    <strong>30 dias</strong>
                    <span>
                        ${priceChange30d >= 0 ? '▲' : '▼'} 
                        ${Math.abs(priceChange30d).toFixed(2)}%
                    </span>
                </div>
                <div class="stat-box">
                    <strong>Market Cap</strong>
                    <span>$${formatarVolume(crypto.market_data.market_cap.usd)}</span>
                </div>
            </div>

            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Informações Adicionais</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <p style="color: var(--text-secondary); margin: 5px 0;"><strong>Máxima 24h:</strong></p>
                        <p style="color: var(--text-primary);">$${formatarNumero(crypto.market_data.high_24h.usd, 2)}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); margin: 5px 0;"><strong>Mínima 24h:</strong></p>
                        <p style="color: var(--text-primary);">$${formatarNumero(crypto.market_data.low_24h.usd, 2)}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); margin: 5px 0;"><strong>Volume 24h:</strong></p>
                        <p style="color: var(--text-primary);">$${formatarVolume(crypto.market_data.total_volume.usd)}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary); margin: 5px 0;"><strong>Market Cap Rank:</strong></p>
                        <p style="color: var(--text-primary);">#${crypto.market_cap_rank || 'N/A'}</p>
                    </div>
                </div>
            </div>

            ${crypto.description && crypto.description.pt ? `
                <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">Sobre ${crypto.name}</h3>
                    <p style="line-height: 1.6; color: var(--text-secondary);">
                        ${crypto.description.pt.substring(0, 500)}${crypto.description.pt.length > 500 ? '...' : ''}
                    </p>
                </div>
            ` : ''}

            <div style="margin-top: 20px; text-align: center;">
                <p style="font-size: 0.9rem; color: var(--text-secondary);">
                    Última atualização: ${new Date(crypto.last_updated).toLocaleString('pt-BR')}
                </p>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        content.innerHTML = '<p style="color: var(--danger);">Erro ao carregar detalhes da criptomoeda</p>';
    }
}

// ========================================
// SISTEMA DE FAVORITOS
// ========================================
function toggleFavorito(event, symbol) {
    event.stopPropagation();
    
    const crypto = allCryptos.find(c => c.symbol === symbol);
    if (!crypto) return;
    
    const adicionado = FavoritosManager.toggleFavorito(crypto);
    
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

function toggleFavoritoModal(event, symbol, cryptoId) {
    event.stopPropagation();
    
    const crypto = allCryptos.find(c => c.symbol === symbol);
    if (!crypto) return;
    
    FavoritosManager.toggleFavorito(crypto);
    
    const modal = document.getElementById('crypto-modal');
    modal.classList.remove('active');
    
    setTimeout(() => {
        showDetails(cryptoId);
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
    const favoritos = FavoritosManager.obterFavoritos().filter(f => f.type === 'cripto');
    
    if (favoritos.length === 0) {
        const grid = document.getElementById('cryptos-grid');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="font-size: 1.5rem;">⭐</p>
                <p style="font-size: 1.2rem; color: var(--text-secondary); margin-top: 10px;">
                    Nenhuma criptomoeda favoritada ainda
                </p>
                <p style="color: var(--text-secondary); margin-top: 10px;">
                    Clique na estrela (☆) nas criptomoedas para adicioná-las aos favoritos
                </p>
            </div>
        `;
        return;
    }
    
    const ids = favoritos.map(f => {
        // Converte o símbolo de volta para o ID da API
        return Object.keys(CRYPTO_SYMBOLS).find(key => CRYPTO_SYMBOLS[key] === f.symbol) || f.symbol.toLowerCase();
    });
    
    loadFavoritesData(ids);
}

async function loadFavoritesData(ids) {
    const grid = document.getElementById('cryptos-grid');
    grid.innerHTML = '<div class="loading">Carregando favoritos...</div>';
    
    try {
        const dados = await buscarDadosCripto(ids);
        
        if (dados) {
            const cryptos = Object.keys(dados).map(id => mapearCriptoParaCard(id, dados[id]));
            renderCryptos(cryptos);
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
// MODAL
// ========================================
function setupModal() {
    const modal = document.getElementById('crypto-modal');
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
        loadCryptos();
    } else if (currentFilter === 'favorites') {
        const favoritos = FavoritosManager.obterFavoritos().filter(f => f.type === 'cripto');
        if (favoritos.length > 0) {
            const ids = favoritos.map(f => {
                return Object.keys(CRYPTO_SYMBOLS).find(key => CRYPTO_SYMBOLS[key] === f.symbol) || f.symbol.toLowerCase();
            });
            loadFavoritesData(ids);
        }
    }
}, 60000);
