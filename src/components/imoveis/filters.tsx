"use client";

import { useState, useEffect, useRef } from "react";

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
  const initialCities = filters.city
    ? filters.city.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const [selectedCities, setSelectedCities] = useState<string[]>(initialCities);
  const [citySearch, setCitySearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selected cities when filters update (e.g. clicking global Clear/Limpar)
  useEffect(() => {
    const nextCities = filters.city
      ? filters.city.split(",").map((c) => c.trim()).filter(Boolean)
      : [];
    setSelectedCities(nextCities);
  }, [filters.city]);

  // Click outside to close dropdown panel
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredCities = cities.filter((city) =>
    (city ?? "").toLowerCase().includes(citySearch.toLowerCase())
  );

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

        {/* Multi-select City Field */}
        <div className="field" style={{ position: "relative" }} ref={dropdownRef}>
          <label>Cidade</label>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "12px 16px",
              background: "rgba(10, 15, 25, 0.8)",
              color: selectedCities.length > 0 ? "var(--text)" : "var(--text-soft)",
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: "47px",
              transition: "border-color 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
              {selectedCities.length === 0
                ? "Todas as cidades"
                : `${selectedCities.length} selecionada(s)`}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#0f1624",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                marginTop: "6px",
                padding: "12px",
                zIndex: 100,
                boxShadow: "var(--shadow-lg)",
                maxHeight: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <input
                type="text"
                placeholder="Pesquisar cidade..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  background: "rgba(10, 15, 25, 0.5)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <div
                style={{
                  overflowY: "auto",
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  paddingRight: "4px",
                  maxHeight: "180px",
                }}
              >
                {filteredCities.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", padding: "8px", fontSize: "0.9rem" }}>
                    Nenhuma cidade encontrada
                  </div>
                ) : (
                  filteredCities.slice(0, 100).map((city) => {
                    const isChecked = selectedCities.includes(city);
                    return (
                      <label
                        key={city}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedCities(selectedCities.filter((c) => c !== city));
                            } else {
                              setSelectedCities([...selectedCities, city]);
                            }
                          }}
                          style={{
                            accentColor: "var(--primary)",
                            cursor: "pointer",
                            width: "16px",
                            height: "16px",
                          }}
                        />
                        <span>{city}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Hidden input to serialize values on GET submit */}
          <input type="hidden" name="city" value={selectedCities.join(",")} />
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

        {/* Selected cities tags display */}
        {selectedCities.length > 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "8px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed var(--border)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div style={{ width: "100%", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "4px" }}>
              Cidades selecionadas:
            </div>
            {selectedCities.map((city) => (
              <span
                key={city}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--primary-soft)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  color: "#60a5fa",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {city}
                <button
                  type="button"
                  onClick={() => setSelectedCities(selectedCities.filter((c) => c !== city))}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    marginLeft: "4px",
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCities([])}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                cursor: "pointer",
                marginLeft: "auto",
                textDecoration: "underline",
              }}
            >
              Limpar todas
            </button>
          </div>
        )}
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
