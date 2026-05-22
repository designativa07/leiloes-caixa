type FiltersProps = {
  filters: {
    search: string;
    state: string;
    city: string;
    saleMode: string;
    financing: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
  };
  states: string[];
  cities: string[];
  saleModes: string[];
};

export function PropertyFilters({
  filters,
  states = [],
  cities = [],
  saleModes = [],
}: FiltersProps) {
  return (
    <form className="panel" action="/imoveis" method="get">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Busca e filtros</h2>
          <div className="muted">Use apenas os filtros essenciais para encontrar oportunidades.</div>
        </div>
      </div>

      <div className="filters-grid">
        <div className="field">
          <label htmlFor="search">Buscar</label>
          <input
            defaultValue={filters.search}
            id="search"
            name="search"
            placeholder="Cidade, bairro, endereco ou numero"
          />
        </div>

        <div className="field">
          <label htmlFor="state">Estado</label>
          <select defaultValue={filters.state} id="state" name="state">
            <option value="">Todos</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="city">Cidade</label>
          <select defaultValue={filters.city} id="city" name="city">
            <option value="">Todas</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="saleMode">Modalidade</label>
          <select defaultValue={filters.saleMode} id="saleMode" name="saleMode">
            <option value="">Todas</option>
            {saleModes.map((saleMode) => (
              <option key={saleMode} value={saleMode}>
                {saleMode}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="financing">Financiamento</label>
          <select defaultValue={filters.financing} id="financing" name="financing">
            <option value="">Todos</option>
            <option value="sim">Sim</option>
            <option value="nao">Nao</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="minPrice">Preco minimo</label>
          <input defaultValue={filters.minPrice} id="minPrice" name="minPrice" placeholder="100000" />
        </div>

        <div className="field">
          <label htmlFor="maxPrice">Preco maximo</label>
          <input defaultValue={filters.maxPrice} id="maxPrice" name="maxPrice" placeholder="500000" />
        </div>

        <div className="field">
          <label htmlFor="sort">Ordenar por</label>
          <select defaultValue={filters.sort} id="sort" name="sort">
            <option value="discount_desc">Maior desconto</option>
            <option value="discount_asc">Menor desconto</option>
            <option value="price_asc">Menor preco</option>
            <option value="price_desc">Maior preco</option>
          </select>
        </div>
      </div>

      <div className="filters-actions">
        <button className="filters-submit" type="submit">
          Aplicar filtros
        </button>
        <a className="filters-clear" href="/imoveis">
          Limpar
        </a>
      </div>
    </form>
  );
}
