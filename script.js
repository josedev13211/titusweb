const pokemonList = document.getElementById("pokemon-list");
const searchInput = document.getElementById("search");
const menuBtn = document.getElementById("menu-btn");
const menu = document.getElementById("menu");
const menuOverlay = document.getElementById("menu-overlay");
const closeMenuBtn = document.getElementById("close-menu");
const modal = document.getElementById("modal");
const compareModal = document.getElementById("compare-modal");
const compareBtn = document.getElementById("compare-btn");
const compareBadge = document.getElementById("compare-badge");
const loading = document.getElementById("loading");

let allPokemons = [];
let currentList = [];
let pokemonsByType = {};
let compareList = [];

// Función para obtener la mejor imagen ANIMADA disponible
function getBestAnimatedImage(pokemon) {
  const animatedOptions = [
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default,
    pokemon.sprites.other?.showdown?.front_default,
    pokemon.sprites.other?.['official-artwork']?.front_default,
    pokemon.sprites.other?.home?.front_default,
    pokemon.sprites.front_default
  ];
  
  return animatedOptions.find(sprite => sprite) || pokemon.sprites.front_default;
}

menuBtn.onclick = () => {
  menu.classList.add("active");
  menuOverlay.classList.add("active");
};

closeMenuBtn.onclick = () => {
  menu.classList.remove("active");
  menuOverlay.classList.remove("active");
};

menuOverlay.onclick = () => {
  menu.classList.remove("active");
  menuOverlay.classList.remove("active");
};

compareBtn.onclick = () => {
  if (compareList.length === 2) {
    showCompareModal();
  } else {
    alert("Selecciona exactamente 2 Pokémon para comparar");
  }
};

function updateCompareBadge() {
  if (compareList.length > 0) {
    compareBadge.textContent = compareList.length;
    compareBadge.classList.remove("hidden");
  } else {
    compareBadge.classList.add("hidden");
  }
}

function toggleCompare(pokemon, checkbox) {
  const index = compareList.findIndex(p => p.id === pokemon.id);
  
  if (index > -1) {
    compareList.splice(index, 1);
    checkbox.classList.remove("checked");
    checkbox.parentElement.classList.remove("compare-selected");
  } else {
    if (compareList.length < 2) {
      compareList.push(pokemon);
      checkbox.classList.add("checked");
      checkbox.parentElement.classList.add("compare-selected");
    } else {
      alert("Solo puedes comparar 2 Pokémon a la vez");
    }
  }
  
  updateCompareBadge();
}

function showCompareModal() {
  const [p1, p2] = compareList;
  
  const sprite1 = getBestAnimatedImage(p1);
  const sprite2 = getBestAnimatedImage(p2);
  
  const types1 = p1.types.map(t => `<span class="type-tag type-${t.type.name}">${translateType(t.type.name)}</span>`).join("");
  const types2 = p2.types.map(t => `<span class="type-tag type-${t.type.name}">${translateType(t.type.name)}</span>`).join("");
  
  let statsHTML = '';
  const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
  
  statNames.forEach(statName => {
    const stat1 = p1.stats.find(s => s.stat.name === statName);
    const stat2 = p2.stats.find(s => s.stat.name === statName);
    
    const value1 = stat1.base_stat;
    const value2 = stat2.base_stat;
    
    const winner1 = value1 > value2 ? 'winner' : '';
    const winner2 = value2 > value1 ? 'winner' : '';
    
    statsHTML += `
      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center; margin-bottom: 15px;">
        <div class="compare-stat ${winner1}">
          <span class="compare-stat-value">${value1}</span>
        </div>
        <span class="compare-stat-name">${translateStat(statName)}</span>
        <div class="compare-stat ${winner2}">
          <span class="compare-stat-value">${value2}</span>
        </div>
      </div>
    `;
  });
  
  compareModal.querySelector(".compare-modal-content").innerHTML = `
    <button class="close-modal">✕</button>
    <h2 style="text-align: center; margin-bottom: 30px; font-size: 2rem;">Comparación de Pokémon</h2>
    
    <div class="compare-grid">
      <div class="compare-pokemon">
        <span class="card-id">#${String(p1.id).padStart(3, '0')}</span>
        <img src="${sprite1}" alt="${p1.name}" class="pokemon-sprite">
        <h2>${p1.name}</h2>
        <div class="types-list" style="justify-content: center;">${types1}</div>
        <div style="margin-top: 20px;">
          <p><strong>Altura:</strong> ${p1.height / 10} m</p>
          <p><strong>Peso:</strong> ${p1.weight / 10} kg</p>
        </div>
      </div>
      
      <div class="compare-pokemon">
        <span class="card-id">#${String(p2.id).padStart(3, '0')}</span>
        <img src="${sprite2}" alt="${p2.name}" class="pokemon-sprite">
        <h2>${p2.name}</h2>
        <div class="types-list" style="justify-content: center;">${types2}</div>
        <div style="margin-top: 20px;">
          <p><strong>Altura:</strong> ${p2.height / 10} m</p>
          <p><strong>Peso:</strong> ${p2.weight / 10} kg</p>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 30px; background: #f8f9fa; padding: 20px; border-radius: 15px;">
      <h3 style="text-align: center; margin-bottom: 20px; color: #666;">Estadísticas</h3>
      ${statsHTML}
    </div>
  `;
  
  compareModal.classList.add("active");
  
  compareModal.querySelector(".close-modal").onclick = () => {
    compareModal.classList.remove("active");
  };
}

compareModal.onclick = (e) => {
  if (e.target === compareModal) {
    compareModal.classList.remove("active");
  }
};

async function loadAllPokemons() {
  try {
    loading.classList.remove("hidden");

    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0");
    const data = await res.json();

    allPokemons = await Promise.all(
      data.results.map(async (p) => {
        const details = await fetch(p.url);
        return details.json();
      })
    );

    currentList = allPokemons;
    organizeByType(allPokemons);
    renderPokemonsByType();
    loading.classList.add("hidden");

  } catch (error) {
    console.error("Error cargando Pokémon:", error);
    loading.textContent = "Error al cargar los Pokémon";
  }
}

function organizeByType(pokemons) {
  pokemonsByType = {};
  
  pokemons.forEach(pokemon => {
    pokemon.types.forEach(typeInfo => {
      const typeName = typeInfo.type.name;
      if (!pokemonsByType[typeName]) {
        pokemonsByType[typeName] = [];
      }
      pokemonsByType[typeName].push(pokemon);
    });
  });
}

function renderPokemonsByType() {
  pokemonList.innerHTML = "";
  
  const sortedTypes = Object.keys(pokemonsByType).sort();
  
  sortedTypes.forEach(type => {
    const section = document.createElement("div");
    section.className = "type-section";
    
    const header = document.createElement("div");
    header.className = "type-header";
    header.innerHTML = `
      <span class="type-badge type-${type}">${translateType(type)}</span>
      <span class="type-count">${pokemonsByType[type].length} Pokémon</span>
    `;
    
    const grid = document.createElement("div");
    grid.id = "pokemon-list";
    
    pokemonsByType[type].forEach(pokemon => {
      const card = createPokemonCard(pokemon);
      grid.appendChild(card);
    });
    
    section.appendChild(header);
    section.appendChild(grid);
    pokemonList.appendChild(section);
  });
}

function createPokemonCard(pokemon) {
  const card = document.createElement("div");
  card.className = "card";
  
  const isSelected = compareList.some(p => p.id === pokemon.id);
  if (isSelected) {
    card.classList.add("compare-selected");
  }
  
  const types = pokemon.types.map(t => 
    `<span class="type-tag type-${t.type.name}">${translateType(t.type.name)}</span>`
  ).join("");
  
  const animatedSprite = getBestAnimatedImage(pokemon);
  
  card.innerHTML = `
    <div class="compare-checkbox ${isSelected ? 'checked' : ''}" data-pokemon-id="${pokemon.id}"></div>
    <span class="card-id">#${String(pokemon.id).padStart(3, '0')}</span>
    <img src="${animatedSprite}" 
         alt="${pokemon.name}"
         class="pokemon-sprite"
         loading="lazy"
         style="animation-delay: ${Math.random() * 2}s;">
    <h3>${pokemon.name}</h3>
    <div class="card-types">${types}</div>
  `;
  
  const checkbox = card.querySelector(".compare-checkbox");
  checkbox.onclick = (e) => {
    e.stopPropagation();
    toggleCompare(pokemon, checkbox);
  };
  
  card.onclick = (e) => {
    if (!e.target.classList.contains("compare-checkbox")) {
      showPokemonModal(pokemon);
    }
  };
  
  return card;
}

function showPokemonModal(pokemon) {
  const types = pokemon.types.map(t => 
    `<span class="type-tag type-${t.type.name}">${translateType(t.type.name)}</span>`
  ).join("");
  
  const abilities = pokemon.abilities.map(a => 
    `<span class="ability-tag">${a.ability.name}</span>`
  ).join("");
  
  const stats = pokemon.stats.map(s => `
    <div class="stat-bar">
      <span class="stat-name">${translateStat(s.stat.name)}</span>
      <span class="stat-value">${s.base_stat}</span>
      <div class="stat-progress">
        <div class="stat-fill" style="width: ${(s.base_stat / 255) * 100}%"></div>
      </div>
    </div>
  `).join("");

  const animatedSprite = getBestAnimatedImage(pokemon);
  
  modal.querySelector(".modal-content").innerHTML = `
    <button class="close-modal">✕</button>
    <div class="modal-header">
      <span class="card-id">#${String(pokemon.id).padStart(3, '0')}</span>
      <img src="${animatedSprite}" 
           alt="${pokemon.name}"
           class="pokemon-sprite">
      <h2>${pokemon.name}</h2>
      <div class="types-list">${types}</div>
    </div>
    
    <div class="modal-info">
      <div class="info-section">
        <h3>Estadísticas</h3>
        <div class="stats-grid">${stats}</div>
      </div>
      
      <div class="info-section">
        <h3>Habilidades</h3>
        <div class="abilities-list">${abilities}</div>
      </div>
      
      <div class="info-section">
        <h3>Información</h3>
        <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
        <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
      </div>

      <div class="info-section" style="text-align: center;">
        <button class="overlay-btn" data-pokemon-id="${pokemon.id}">
          🎬 Mostrar Overlay para OBS
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add("active");
  
  modal.querySelector(".close-modal").onclick = () => {
    modal.classList.remove("active");
  };

  // Evento para el botón de overlay
  modal.querySelector(".overlay-btn").onclick = () => {
    const overlayUrl = `pokemon-overlay.html?id=${pokemon.id}`;
    window.open(overlayUrl, '_blank', 'width=600,height=700');
  };
}

modal.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
};

searchInput.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  
  if (value === "") {
    organizeByType(currentList);
    renderPokemonsByType();
    return;
  }
  
  const filtered = currentList.filter(p => 
    p.name.toLowerCase().includes(value) ||
    String(p.id).includes(value)
  );
  
  organizeByType(filtered);
  renderPokemonsByType();
});

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.onclick = async () => {
    document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    
    loading.classList.remove("hidden");
    pokemonList.innerHTML = "";
    
    if (btn.dataset.filter === "all") {
      await loadAllPokemons();
    } else if (btn.dataset.gen) {
      await loadGeneration(btn.dataset.gen);
    } else if (btn.dataset.type) {
      await loadByType(btn.dataset.type);
    }
    
    menu.classList.remove("active");
    menuOverlay.classList.remove("active");
    loading.classList.add("hidden");
  };
});

async function loadGeneration(gen) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`);
    const data = await res.json();

    const pokemons = await Promise.all(
      data.pokemon_species.map(async (p) => {
        const details = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.name}`);
        return details.json();
      })
    );

    pokemons.sort((a, b) => a.id - b.id);

    currentList = pokemons;
    organizeByType(pokemons);
    renderPokemonsByType();

  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadByType(type) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    const data = await res.json();
    
    const pokemons = await Promise.all(
      data.pokemon.slice(0, 50).map(async (p) => {
        const details = await fetch(p.pokemon.url);
        return details.json();
      })
    );
    
    currentList = pokemons;
    organizeByType(pokemons);
    renderPokemonsByType();
  } catch (error) {
    console.error("Error:", error);
  }
}

function translateType(type) {
  const translations = {
    normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico",
    grass: "Planta", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
    ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
    rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
    steel: "Acero", fairy: "Hada"
  };
  return translations[type] || type;
}

function translateStat(stat) {
  const translations = {
    hp: "PS", attack: "Ataque", defense: "Defensa",
    "special-attack": "Ataque Esp.", "special-defense": "Defensa Esp.",
    speed: "Velocidad"
  };
  return translations[stat] || stat;
}

loadAllPokemons();