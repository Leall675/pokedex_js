const getTypeColor = type => {
  const normal = '#F5F5F5';
  return {
    normal,
    fire: '#FDDFDF',
    grass: '#DEFDE0',
    electric: '#FCF7DE',
    ice: '#DEF3FD',
    water: '#DEF3FD',
    ground: '#F4E7DA',
    rock: '#D5D5D4',
    fairy: '#FCEAFF',
    poison: '#98D7A5',
    bug: '#F8D5A3',
    ghost: '#CAC0F7',
    dragon: '#97B3E6',
    psychic: '#EAEDA1',
    fighting: '#E6E0D4'
  }[type] || normal;
};

const getPokemonsType = async (pokeApi) => {
  const promises = pokeApi.map(result => fetch(result.url));
  const responses = await Promise.allSettled(promises);
  const fullfilled = responses.filter(response => response.status === 'fulfilled');
  const pokePromises = fullfilled.map(url => url.value.json());
  const pokemons = await Promise.all(pokePromises);
  return pokemons.map(fullfilled => fullfilled.types.map(info => info.type.name));
};

const getIdsPokemons = pokeApi => {
  return pokeApi.map(({ url }) => {
    const urlsArrays = url.split('/');
    return urlsArrays[6];
  });
};

const getImgPokemons = async idsPoke => {
  const promises = idsPoke.map(id => fetch(`./assets/img/${id}.png`));
  const responses = await Promise.allSettled(promises);
  const fullfilled = responses.filter(response => response.status === 'fulfilled');
  return fullfilled.map(resp => resp.value.url);
};

const renderPokemons = (pokemons) => {
  const ul = document.querySelector('[data-js="pokemons-list"]');
  const fragment = document.createDocumentFragment();
  pokemons.forEach(({id, name, types, imgUrl }) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    const nameContainer = document.createElement('h2');
    const typeContainer = document.createElement('p');
    const [firstType] = types;

    img.setAttribute('src', imgUrl);
    img.setAttribute('alt', name);
    img.setAttribute('class', 'card-image');
    li.setAttribute('class', `card ${firstType}`);
    li.style.setProperty('--type-color', getTypeColor(firstType));
    nameContainer.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`;
    typeContainer.textContent = types.length > 1 ? types.join(' | ') : firstType;
    li.append(img, nameContainer, typeContainer);
    fragment.append(li);
  });
  ul.append(fragment);
};

const offset_limit = 150;
let limit = 15;
let offset = 0;

const getPokemons = async () => {
  try {
    if (offset >= offset_limit) return [];

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error(`Erro na resposta: ${response.statusText}`);
    
    const { results: pokeApi } = await response.json();
    if (pokeApi.length === 0) return [];

    const types = await getPokemonsType(pokeApi);
    const idsPoke = await getIdsPokemons(pokeApi);
    const images = await getImgPokemons(idsPoke);
    const pokemons = idsPoke.map((id, i) => ({ id, name: pokeApi[i].name, types: types[i], imgUrl: images[i] }));
    
    offset += limit;
    return pokemons;
  } catch (error) {
    console.error('Ocorreu um erro na requisição', error);
    return [];
  }
};

const observerLastPokemon = (pokemonsObserver) => {
  const lastPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild;
  if (lastPokemon) pokemonsObserver.observe(lastPokemon);
};

const handleNextPokemonsRender = () => {
  const pokemonsObserver = new IntersectionObserver(async ([lastPokemon], observer) => {
    if (!lastPokemon.isIntersecting || offset >= offset_limit) return;
    observer.unobserve(lastPokemon.target);
    const pokemons = await getPokemons();
    if (pokemons.length > 0) {
      renderPokemons(pokemons);
      observerLastPokemon(pokemonsObserver);
    }
  });
  observerLastPokemon(pokemonsObserver);
};

const PokeDex = async () => {
  const pokemons = await getPokemons();
  if (pokemons.length > 0) {
    renderPokemons(pokemons);
    handleNextPokemonsRender();
  }
};

PokeDex();
