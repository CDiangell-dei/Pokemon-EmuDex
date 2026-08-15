import React from 'react';

export const TypeBadge = ({ type }) => {
  const colors = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400 text-gray-900',
    ice: 'bg-cyan-300 text-gray-900',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-700',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500 text-gray-900',
    rock: 'bg-yellow-800',
    ghost: 'bg-indigo-800',
    dragon: 'bg-violet-600',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300 text-gray-900'
  };

  return (
    <span
      className={`${
        colors[type] || 'bg-gray-500'
      } text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm tracking-wider`}
    >
      {type}
    </span>
  );
};
