// ========== CONFIGURAÇÃO DE APIs ==========
const API_CONFIG = {
    newsapi: {
        key: '8f7311707a2845838bde6554318672b7', // Substitua por: https://newsapi.org/
        baseUrl: 'https://newsapi.org/'
    },
    brapi: {
        baseUrl: 'https://brapi.dev/api',
        token: 'bSEpRmEesGWZqBtyyMFKwu' // Opcional para uso básico
    },
    coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3'
    },
    awesomeapi: {
        baseUrl: 'https://economia.awesomeapi.com.br/json'
    }
};

// ========== RELÓGIO DE MERCADO ==========
function atualizarRelogioMercado() {
    const agora = new Date();
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataString = agora.toLocaleDateString('pt-BR', opcoes);
    const horaString = agora.toLocaleTimeString('pt-BR');
    
    const diaSemana = agora.getDay();
    const hora = agora.getHours();
    const mercadoAberto = (diaSemana >= 1 && diaSemana <= 5) && (hora >= 10 && hora < 17);
    
    const statusClass = mercadoAberto ? 'market-open' : 'market-closed';
    const statusText = mercadoAberto ? 'Mercado Aberto' : 'Mercado Fechado';
    
    const clockElement = document.getElementById('market-clock');
    if (clockElement) {
        clockElement.innerHTML = `
            ${dataString} | ${horaString} | 
            <span class="market-status ${statusClass}">
                <span class="status-dot"></span>
                <strong>${statusText}</strong>
            </span>
        `;
    }
}

// ========== API: CRIPTOMOEDAS (CoinGecko) ==========
async function buscarDadosCripto(ids = ['bitcoin', 'ethereum']) {
    try {
        const idsStr = ids.join(',');
        const response = await fetch(
            `${API_CONFIG.coingecko.baseUrl}/simple/price?ids=${idsStr}&vs_currencies=usd,brl&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
        );
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar dados de cripto:', error);
        return null;
    }
}

// ========== API: AÇÕES BRASILEIRAS (Brapi) ==========
async function buscarAcoesBR(tickers = ['^BVSP', 'PETR4', 'VALE3', 'ITUB4']) {
    try {
        const tickersStr = tickers.join(',');
        const response = await fetch(
            `${API_CONFIG.brapi.baseUrl}/quote/${tickersStr}?token=${API_CONFIG.brapi.token}`
        );
        const data = await response.json();
        return data.results || null;
    } catch (error) {
        console.error('Erro ao buscar ações BR:', error);
        return null;
    }
}

// ========== API: CÂMBIO (AwesomeAPI) ==========
async function buscarCambio(moedas = ['USD-BRL', 'EUR-BRL']) {
    try {
        const moedasStr = moedas.join(',');
        const response = await fetch(`${API_CONFIG.awesomeapi.baseUrl}/last/${moedasStr}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar câmbio:', error);
        return null;
    }
}

// ========== API: NOTÍCIAS (NewsAPI) ==========
async function buscarNoticias(query = 'mercado financeiro brasil', pageSize = 6) {
    try {
        const response = await fetch(
            `${API_CONFIG.newsapi.baseUrl}/everything?q=${encodeURIComponent(query)}&language=pt&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${API_CONFIG.newsapi.key}`
        );
        const data = await response.json();
        return data.status === 'ok' ? data.articles : null;
    } catch (error) {
        console.error('Erro ao buscar notícias:', error);
        return null;
    }
}

// ========== API: DETALHES DE ATIVO ==========
async function buscarDetalheAcao(ticker) {
    try {
        const response = await fetch(
            `${API_CONFIG.brapi.baseUrl}/quote/${ticker}?range=1mo&interval=1d&fundamental=true&dividends=true&token=${API_CONFIG.brapi.token}`
        );
        const data = await response.json();
        return data.results && data.results.length > 0 ? data.results[0] : null;
    } catch (error) {
        console.error('Erro ao buscar detalhes da ação:', error);
        return null;
    }
}

// ========== UTILITÁRIOS ==========
function formatarMoeda(valor, moeda = 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: moeda,
        minimumFractionDigits: 2
    }).format(valor);
}

function formatarNumero(valor, decimais = 2) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais
    });
}

function calcularTempoAtras(dataISO) {
    const agora = new Date();
    const passado = new Date(dataISO);
    const diffMs = agora - passado;
    const diffSeg = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSeg / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHrs / 24);
    
    if (diffDias > 0) return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`;
    if (diffHrs > 0) return `${diffHrs}h atrás`;
    if (diffMin > 0) return `${diffMin}min atrás`;
    return 'Agora mesmo';
}

function obterClasseVariacao(valor) {
    return valor >= 0 ? 'text-success' : 'text-danger';
}

function obterSeta(valor) {
    return valor >= 0 ? '▲' : '▼';
}

// ========== MODAL DE ATIVO ==========
function criarModal(titulo, conteudo) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${titulo}</h2>
                <button class="modal-close" onclick="fecharModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                ${conteudo}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal(modal.querySelector('.modal-close'));
        }
    });
    
    return modal;
}

function fecharModal(botao) {
    const modal = botao.closest('.modal-overlay');
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 200);
}

async function abrirModalAtivo(ticker) {
    const loadingModal = criarModal(ticker, '<div style="text-align: center; padding: 2rem;">Carregando informações...</div>');
    
    const dados = await buscarDetalheAcao(ticker);
    
    fecharModal(loadingModal.querySelector('.modal-close'));
    
    if (!dados) {
        criarModal('Erro', '<p>Não foi possível carregar os dados deste ativo.</p>');
        return;
    }
    
    const conteudo = `
        <div class="asset-info-grid">
            <div class="info-item">
                <div class="info-label">Preço Atual</div>
                <div class="info-value">${formatarMoeda(dados.regularMarketPrice)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Variação</div>
                <div class="info-value ${obterClasseVariacao(dados.regularMarketChangePercent)}">
                    ${obterSeta(dados.regularMarketChangePercent)} ${Math.abs(dados.regularMarketChangePercent).toFixed(2)}%
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Mínima (52 sem)</div>
                <div class="info-value">${formatarMoeda(dados.fiftyTwoWeekLow || 0)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Máxima (52 sem)</div>
                <div class="info-value">${formatarMoeda(dados.fiftyTwoWeekHigh || 0)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Volume</div>
                <div class="info-value">${formatarNumero(dados.regularMarketVolume || 0, 0)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Market Cap</div>
                <div class="info-value">${formatarMoeda(dados.marketCap || 0)}</div>
            </div>
        </div>
        
        ${dados.dividendsData && dados.dividendsData.length > 0 ? `
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Histórico de Dividendos</h3>
            <table class="dividends-table">
                <thead>
                    <tr>
                        <th>Data de Pagamento</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${dados.dividendsData.slice(0, 5).map(div => `
                        <tr>
                            <td>${new Date(div.date * 1000).toLocaleDateString('pt-BR')}</td>
                            <td class="text-success">${formatarMoeda(div.dividends)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : ''}
        
        ${dados.longName ? `
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Sobre ${dados.longName}</h3>
            <p style="color: var(--text-secondary); line-height: 1.8;">
                ${dados.longBusinessSummary || 'Informações não disponíveis.'}
            </p>
        ` : ''}
    `;
    
    criarModal(`${dados.symbol} - ${dados.shortName || dados.longName}`, conteudo);
}

// Inicializar relógio
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        atualizarRelogioMercado();
        setInterval(atualizarRelogioMercado, 1000);
    });
} else {
    atualizarRelogioMercado();
    setInterval(atualizarRelogioMercado, 1000);
}
