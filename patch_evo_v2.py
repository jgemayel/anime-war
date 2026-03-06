#!/usr/bin/env python3
"""
Patch script for multi-stage Pokemon-style evolution system.
Generates evolution data for all 202 characters (102 One Piece + 100 Naruto).
"""

import json
import re
import os

# Evolution data for all 202 characters
CHAR_EVOLUTIONS = {
    # ONE PIECE CHARACTERS (op1-op102)
    'op1': {
        'stages': [
            {'name': 'Rubber Boy Luffy', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Gear 4 Luffy', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Gear 5 Nika', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Gear 4: Boundman', 'type': 'df', 'power': 95, 'acc': 88, 'pp': 8, 'effect': None}, 3: {'name': 'Bajrang Gatling', 'type': 'special', 'power': 125, 'acc': 75, 'pp': 4, 'effect': None}}
    },
    'op2': {
        'stages': [
            {'name': 'Three-Sword Zoro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Asura Zoro', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'King of Hell Zoro', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Asura: Demon Flash', 'type': 'sword', 'power': 92, 'acc': 90, 'pp': 8, 'effect': None}, 3: {'name': 'King Hell Retribution', 'type': 'kenjutsu', 'power': 128, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op3': {
        'stages': [
            {'name': 'Black Leg Sanji', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Diable Jambe Sanji', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Ifrit Jambe Sanji', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Hell Memories', 'type': 'special', 'power': 88, 'acc': 85, 'pp': 8, 'effect': None}, 3: {'name': 'Inferno Kick', 'type': 'taijutsu', 'power': 115, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op4': {
        'stages': [
            {'name': 'Cat Burglar Nami', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Zeus Nami', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Thunderbolt Tempo', 'type': 'special', 'power': 85, 'acc': 80, 'pp': 6, 'effect': None}}
    },
    'op5': {
        'stages': [
            {'name': 'Devil Child Robin', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Demonio Fleur Robin', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Demonio Fleur: Gigantesco', 'type': 'special', 'power': 82, 'acc': 85, 'pp': 7, 'effect': None}}
    },
    'op6': {
        'stages': [
            {'name': 'Cyborg Franky', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'General Franky', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Shogun: Cannon Blast', 'type': 'special', 'power': 88, 'acc': 82, 'pp': 6, 'effect': None}}
    },
    'op7': {
        'stages': [
            {'name': 'Fish-Man Jinbe', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Helmsman Jinbe', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Knight of the Sea', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Ryutei Suigun', 'type': 'physical', 'power': 90, 'acc': 88, 'pp': 7, 'effect': None}, 3: {'name': 'Ocean Sovereignty', 'type': 'special', 'power': 120, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op8': {
        'stages': [
            {'name': 'Cotton Candy Chopper', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Monster Point Chopper', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Monster Rampage', 'type': 'taijutsu', 'power': 80, 'acc': 85, 'pp': 7, 'effect': None}}
    },
    'op9': {
        'stages': [
            {'name': 'Soul King Brook', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Revive-Revive Brook', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Soul Music: Inferno', 'type': 'special', 'power': 83, 'acc': 85, 'pp': 7, 'effect': None}}
    },
    'op10': {
        'stages': [
            {'name': 'Sniper Usopp', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sogeking / God Usopp', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Gigantesco Muzzle', 'type': 'special', 'power': 78, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'op11': {
        'stages': [
            {'name': 'Surgeon of Death', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Awakened Law', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'KRoom Law', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Awakening: Amputate', 'type': 'special', 'power': 92, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Kroom: Destruction', 'type': 'df', 'power': 122, 'acc': 78, 'pp': 5, 'effect': None}}
    },
    'op12': {
        'stages': [
            {'name': 'Captain Kid', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Awakened Kid', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Punk Assign Kid', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Magnetism Mastery', 'type': 'special', 'power': 90, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Punk Collapse', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op13': {
        'stages': [
            {'name': 'Kaido of the Beasts', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hybrid Form Kaido', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Flame Dragon Kaido', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Hybrid Dragon Explosion', 'type': 'special', 'power': 98, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Flame Calamity', 'type': 'special', 'power': 132, 'acc': 75, 'pp': 4, 'effect': None}}
    },
    'op14': {
        'stages': [
            {'name': 'Big Mom', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Ikoku Big Mom', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Misery Big Mom', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Soul Burst', 'type': 'special', 'power': 96, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Misery Wave', 'type': 'special', 'power': 130, 'acc': 76, 'pp': 4, 'effect': None}}
    },
    'op15': {
        'stages': [
            {'name': 'Young Doffy', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'String-String Doffy', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Awakened Doflamingo', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'String String Cage', 'type': 'special', 'power': 88, 'acc': 87, 'pp': 8, 'effect': None}, 3: {'name': 'White Paradise', 'type': 'special', 'power': 115, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op16': {
        'stages': [
            {'name': 'Mr. 0 Crocodile', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Desert King Crocodile', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Cross Guild Crocodile', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Sand Tomb Barrage', 'type': 'special', 'power': 90, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Desert Apocalypse', 'type': 'special', 'power': 118, 'acc': 78, 'pp': 5, 'effect': None}}
    },
    'op17': {
        'stages': [
            {'name': 'CP9 Lucci', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Leopard Lucci', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Awakened Lucci', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Leopard Fang', 'type': 'taijutsu', 'power': 92, 'acc': 88, 'pp': 7, 'effect': None}, 3: {'name': 'Soru Soru Mastery', 'type': 'special', 'power': 120, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op18': {
        'stages': [
            {'name': 'Marine Hunter Mihawk', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Greatest Swordsman', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Cross Guild Mihawk', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Black Blade Descent', 'type': 'sword', 'power': 95, 'acc': 90, 'pp': 7, 'effect': None}, 3: {'name': 'Night Eternal', 'type': 'kenjutsu', 'power': 125, 'acc': 82, 'pp': 4, 'effect': None}}
    },
    'op19': {
        'stages': [
            {'name': 'Blackbeard', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Yami Yami Teach', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Dual Fruit Blackbeard', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Vortex Darkness', 'type': 'special', 'power': 93, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Earthquake Supremacy', 'type': 'special', 'power': 128, 'acc': 78, 'pp': 4, 'effect': None}}
    },
    'op20': {
        'stages': [
            {'name': 'Red Hair Shanks', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Conqueror Shanks', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Divine Departure Shanks', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Conquerors Domination', 'type': 'haki', 'power': 96, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Red Destiny', 'type': 'special', 'power': 130, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op21': {
        'stages': [
            {'name': 'Whitebeard', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Quake Man Whitebeard', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Strongest Man Alive', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Earthquake Wave', 'type': 'special', 'power': 97, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'World Destruction', 'type': 'special', 'power': 132, 'acc': 75, 'pp': 4, 'effect': None}}
    },
    'op22': {
        'stages': [
            {'name': 'Admiral Akainu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Magma Fist Akainu', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Fleet Admiral Sakazuki', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Magma Fist Eruption', 'type': 'special', 'power': 94, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Absolute Justice', 'type': 'special', 'power': 126, 'acc': 78, 'pp': 4, 'effect': None}}
    },
    'op23': {
        'stages': [
            {'name': 'Fire Fist Ace', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Entei Ace', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Flame Emperor Ace', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Entei Prison', 'type': 'special', 'power': 89, 'acc': 85, 'pp': 8, 'effect': None}, 3: {'name': 'Flame Emperor Crown', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op24': {
        'stages': [
            {'name': 'Sweet Commander Katakuri', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mochi Katakuri', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Awakened Katakuri', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Mochi Blade Storm', 'type': 'special', 'power': 93, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Perfection Unleashed', 'type': 'special', 'power': 124, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op25': {
        'stages': [
            {'name': 'All-Star King', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Lunarian King', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Inferno King', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Lunarian Flame', 'type': 'special', 'power': 91, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Infernal Ascension', 'type': 'special', 'power': 118, 'acc': 79, 'pp': 5, 'effect': None}}
    },
    'op26': {
        'stages': [
            {'name': 'All-Star Queen', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Brachio Queen', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Cyborg Queen', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Brachio Mastery', 'type': 'special', 'power': 89, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Virus Supremacy', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op27': {
        'stages': [
            {'name': 'Headliner Ulti', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Pachycephalosaurus Ulti', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Dino Headbutt', 'type': 'taijutsu', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op28': {
        'stages': [
            {'name': 'Headliner Black Maria', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Rosamygale Maria', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Web Prison', 'type': 'special', 'power': 79, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'op29': {
        'stages': [
            {'name': 'Headliner Sasaki', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Triceratops Sasaki', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Trice Charge', 'type': 'taijutsu', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op30': {
        'stages': [
            {'name': 'Headliner Who\'s Who', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sabertooth Who\'s Who', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Feline Fury', 'type': 'taijutsu', 'power': 82, 'acc': 86, 'pp': 7, 'effect': None}}
    },
    'op31': {
        'stages': [
            {'name': 'Ghost Princess', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hollow Perona', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Ghost Mastery', 'type': 'special', 'power': 76, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'op32': {
        'stages': [
            {'name': 'Mad Scientist Caesar', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Shinokuni Caesar', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Gas Cloud Doom', 'type': 'special', 'power': 75, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'op33': {
        'stages': [
            {'name': 'Young Roger', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Pirate King Roger', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Divine Departure Roger', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'King\'s Will', 'type': 'haki', 'power': 97, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Final Legacy', 'type': 'special', 'power': 131, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op34': {
        'stages': [
            {'name': 'Young Garp', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Garp the Fist', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Garp the Hero', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Justice Cannon', 'type': 'special', 'power': 96, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Hero\'s Legacy', 'type': 'special', 'power': 129, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op35': {
        'stages': [
            {'name': 'Admiral Aokiji', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Ice Age Aokiji', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Blackbeard Kuzan', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Ice Age Apocalypse', 'type': 'special', 'power': 92, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Eternal Frost', 'type': 'special', 'power': 123, 'acc': 79, 'pp': 4, 'effect': None}}
    },
    'op36': {
        'stages': [
            {'name': 'Admiral Kizaru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Light Speed Kizaru', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Yasakani Kizaru', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Light Speed Barrage', 'type': 'special', 'power': 91, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Mirror World Destruction', 'type': 'special', 'power': 122, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op37': {
        'stages': [
            {'name': 'Young Rayleigh', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Dark King Rayleigh', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Legend Rayleigh', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Haki Sword Mastery', 'type': 'sword', 'power': 94, 'acc': 89, 'pp': 7, 'effect': None}, 3: {'name': 'Dark King Supremacy', 'type': 'special', 'power': 126, 'acc': 82, 'pp': 4, 'effect': None}}
    },
    'op38': {
        'stages': [
            {'name': 'God Enel', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Raigo Enel', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Thunder God Descent', 'type': 'special', 'power': 84, 'acc': 83, 'pp': 7, 'effect': None}}
    },
    'op39': {
        'stages': [
            {'name': 'Flying Pirate Shiki', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Golden Lion Shiki', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Legend Shiki', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Floating Paradise', 'type': 'special', 'power': 88, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Sky Pierce', 'type': 'special', 'power': 116, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op40': {
        'stages': [
            {'name': 'Inspector Sengoku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Buddha Sengoku', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Fleet Admiral Sengoku', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Buddha Salvation', 'type': 'special', 'power': 93, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Divine Judgment', 'type': 'special', 'power': 125, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op41': {
        'stages': [
            {'name': 'Young Sabo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Flame Emperor Sabo', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Dragon Claw Sabo', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Flame Throne', 'type': 'special', 'power': 90, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Dragon Claw Flame', 'type': 'special', 'power': 120, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op42': {
        'stages': [
            {'name': 'Revolutionary Dragon', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'World\'s Most Wanted', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Storm Dragon', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Wind Blade Revolution', 'type': 'special', 'power': 98, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Storm Dragon Wrath', 'type': 'special', 'power': 132, 'acc': 76, 'pp': 4, 'effect': None}}
    },
    'op43': {
        'stages': [
            {'name': 'Snake Princess', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Love-Love Hancock', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Empress Hancock', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Love Concentration', 'type': 'special', 'power': 87, 'acc': 85, 'pp': 8, 'effect': None}, 3: {'name': 'Empress Perfection', 'type': 'special', 'power': 115, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op44': {
        'stages': [
            {'name': 'Tyrant Kuma', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Pacifista Kuma', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Nika Kuma', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Repel Meteor', 'type': 'special', 'power': 91, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Nika Upgrade', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op45': {
        'stages': [
            {'name': 'Shadow Master Moria', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Shadow Asgard Moria', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Shadow Army Swarm', 'type': 'special', 'power': 80, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'op46': {
        'stages': [
            {'name': 'Clown Buggy', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Emperor Buggy', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Separation Supremacy', 'type': 'special', 'power': 77, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'op47': {
        'stages': [
            {'name': 'Young Oden', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Daimyo Oden', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Legend Oden', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Twin Sword Dance', 'type': 'sword', 'power': 93, 'acc': 89, 'pp': 7, 'effect': None}, 3: {'name': 'Heaven Piercing Slash', 'type': 'kenjutsu', 'power': 127, 'acc': 82, 'pp': 4, 'effect': None}}
    },
    'op48': {
        'stages': [
            {'name': 'Oni Princess Yamato', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Guardian Yamato', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Ice Wolf Yamato', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Oni Mastery', 'type': 'special', 'power': 88, 'acc': 86, 'pp': 8, 'effect': None}, 3: {'name': 'Ice Wolf Supremacy', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op49': {
        'stages': [
            {'name': 'First Division Marco', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Phoenix Marco', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Blue Flame Marco', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Phoenix Regeneration', 'type': 'special', 'power': 90, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Blue Flame Resurrection', 'type': 'special', 'power': 124, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op50': {
        'stages': [
            {'name': 'Third Division Jozu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Diamond Jozu', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Brilliant Jozu', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Diamond Armor', 'type': 'special', 'power': 86, 'acc': 88, 'pp': 8, 'effect': None}, 3: {'name': 'Brilliant Crushing', 'type': 'special', 'power': 114, 'acc': 81, 'pp': 5, 'effect': None}}
    },
    'op51': {
        'stages': [
            {'name': 'Fifth Division Vista', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Flower Sword Vista', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Vista of the Roses', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Flower Blade Elegance', 'type': 'sword', 'power': 89, 'acc': 88, 'pp': 7, 'effect': None}, 3: {'name': 'Rose Garden Mastery', 'type': 'kenjutsu', 'power': 116, 'acc': 81, 'pp': 5, 'effect': None}}
    },
    'op52': {
        'stages': [
            {'name': 'Head Jailer Shiryu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Invisible Shiryu', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Clear-Clear Shiryu', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Invisibility Mastery', 'type': 'special', 'power': 87, 'acc': 86, 'pp': 8, 'effect': None}, 3: {'name': 'Clear World Slice', 'type': 'special', 'power': 115, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op53': {
        'stages': [
            {'name': 'Shadow Ruler Imu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'World Sovereign Imu', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Imu of the Throne', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'World Erasure', 'type': 'special', 'power': 99, 'acc': 84, 'pp': 6, 'effect': None}, 3: {'name': 'Throne Annihilation', 'type': 'special', 'power': 134, 'acc': 74, 'pp': 3, 'effect': None}}
    },
    'op54': {
        'stages': [
            {'name': 'Elder Saturn', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sandworm Saturn', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Ushi-Oni Saturn', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Sandworm Tunnel', 'type': 'special', 'power': 92, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Ushi-Oni Transformation', 'type': 'special', 'power': 127, 'acc': 78, 'pp': 4, 'effect': None}}
    },
    'op55': {
        'stages': [
            {'name': 'Admiral Fujitora', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Gravity Blade Fujitora', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Meteor Strike Fujitora', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Gravity Sword Impact', 'type': 'special', 'power': 91, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Meteor Shower Collapse', 'type': 'special', 'power': 125, 'acc': 79, 'pp': 4, 'effect': None}}
    },
    'op56': {
        'stages': [
            {'name': 'Admiral Ryokugyu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Forest Admiral', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Wood-Wood Ryokugyu', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Forest Growth Rush', 'type': 'special', 'power': 90, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Wood Dominion', 'type': 'special', 'power': 123, 'acc': 80, 'pp': 4, 'effect': None}}
    },
    'op57': {
        'stages': [
            {'name': 'First Mate Beckman', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Genius Beckman', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Beckman the Rival', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Genius Strategy', 'type': 'special', 'power': 89, 'acc': 88, 'pp': 7, 'effect': None}, 3: {'name': 'Legendary Rival Clash', 'type': 'special', 'power': 121, 'acc': 81, 'pp': 4, 'effect': None}}
    },
    'op58': {
        'stages': [
            {'name': 'Massacre Soldier', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Punisher Killer', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Punisher Blade Impact', 'type': 'special', 'power': 82, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op59': {
        'stages': [
            {'name': 'Marine Spy Drake', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Allosaurus Drake', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Dino Assault', 'type': 'taijutsu', 'power': 81, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op60': {
        'stages': [
            {'name': 'Magician Hawkins', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Straw Man Hawkins', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Straw Puppet Army', 'type': 'special', 'power': 78, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'op61': {
        'stages': [
            {'name': 'Roar of the Sea', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sound Blast Apoo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sonic Boom Barrage', 'type': 'special', 'power': 80, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'op62': {
        'stages': [
            {'name': 'Gang Bege', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Big Father Bege', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Castle Fortification', 'type': 'special', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op63': {
        'stages': [
            {'name': 'Mad Monk Urouge', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Damage Convert Urouge', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Pain Amplification', 'type': 'special', 'power': 81, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'op64': {
        'stages': [
            {'name': 'Big Eater Bonney', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Nika Bonney', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Age Acceleration', 'type': 'special', 'power': 77, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'op65': {
        'stages': [
            {'name': 'Cabin Boy Koby', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Captain Koby', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Future Foresight', 'type': 'special', 'power': 76, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'op66': {
        'stages': [
            {'name': 'Captain Smoker', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Vice Admiral Smoker', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Smoke Screen Mastery', 'type': 'special', 'power': 78, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op67': {
        'stages': [
            {'name': 'Guard Sentomaru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Commander Sentomaru', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Pacifista Control', 'type': 'special', 'power': 80, 'acc': 85, 'pp': 7, 'effect': None}}
    },
    'op68': {
        'stages': [
            {'name': 'Warden Magellan', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Venom Demon Magellan', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Hydra Magellan', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Poison Dragon Fury', 'type': 'special', 'power': 89, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Hydra Apocalypse', 'type': 'special', 'power': 118, 'acc': 79, 'pp': 5, 'effect': None}}
    },
    'op69': {
        'stages': [
            {'name': 'Vice Admiral Tsuru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Great Staff Tsuru', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Washing Chain Mastery', 'type': 'special', 'power': 79, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op70': {
        'stages': [
            {'name': 'Admiral Kong', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Commander in Chief Kong', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Supreme Kong', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Kong\'s Authority', 'type': 'special', 'power': 88, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Supreme Power', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op71': {
        'stages': [
            {'name': 'Supersonic Augur', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Warp-Warp Augur', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Warp Teleport', 'type': 'special', 'power': 76, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'op72': {
        'stages': [
            {'name': 'Corrupt King Pizarro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Island-Island Pizarro', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Island Merger', 'type': 'special', 'power': 83, 'acc': 83, 'pp': 7, 'effect': None}}
    },
    'op73': {
        'stages': [
            {'name': 'Sweet Commander Cracker', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Biscuit Soldier Cracker', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Infinite Army Cracker', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Biscuit Army Surge', 'type': 'special', 'power': 87, 'acc': 85, 'pp': 8, 'effect': None}, 3: {'name': 'Infinite Arsenal', 'type': 'special', 'power': 116, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op74': {
        'stages': [
            {'name': 'Sweet Commander Smoothie', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Wring-Wring Smoothie', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Giant Smoothie', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Juice Extraction', 'type': 'special', 'power': 88, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Giant Growth Form', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op75': {
        'stages': [
            {'name': 'Candy Man Perospero', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Candy Maiden Perospero', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Candy Fortress Prison', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op76': {
        'stages': [
            {'name': 'Heat-Heat Oven', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Nekketsu Oven', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Heat Armor Mastery', 'type': 'special', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op77': {
        'stages': [
            {'name': 'All-Star Jack', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mammoth Jack', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Jack the Drought', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Mammoth Crush', 'type': 'taijutsu', 'power': 90, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Drought Supremacy', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op78': {
        'stages': [
            {'name': 'Headliner Page One', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Spinosaurus Page One', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Spinosaurus Fang', 'type': 'taijutsu', 'power': 79, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op79': {
        'stages': [
            {'name': 'Foxfire Kinemon', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Akazaya Kinemon', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Akazaya Fury', 'type': 'special', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op80': {
        'stages': [
            {'name': 'Kyoshiro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Denjiro Unmasked', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Scabbard Blade Art', 'type': 'sword', 'power': 82, 'acc': 86, 'pp': 8, 'effect': None}}
    },
    'op81': {
        'stages': [
            {'name': 'Duke Inuarashi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sulong Inuarashi', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sulong Beast Fury', 'type': 'taijutsu', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op82': {
        'stages': [
            {'name': 'Boss Nekomamushi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sulong Nekomamushi', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sulong Cat Assault', 'type': 'taijutsu', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op83': {
        'stages': [
            {'name': 'Bandit Ashura', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Ashura the Scabbard', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Ashura Blade Strike', 'type': 'sword', 'power': 83, 'acc': 86, 'pp': 8, 'effect': None}}
    },
    'op84': {
        'stages': [
            {'name': 'Kawamatsu the Kappa', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Yokozuna Kawamatsu', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sumo Champion Crush', 'type': 'taijutsu', 'power': 82, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op85': {
        'stages': [
            {'name': 'Commander Izo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Gunslinger Izo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Gun Mastery Barrage', 'type': 'special', 'power': 80, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op86': {
        'stages': [
            {'name': 'Emporio Ivankov', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hormone Monster Ivankov', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Hormone Conversion Mastery', 'type': 'special', 'power': 79, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'op87': {
        'stages': [
            {'name': 'Cannibal Bartolomeo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Barrier Crash Bartolomeo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Barrier Wall Smash', 'type': 'special', 'power': 81, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op88': {
        'stages': [
            {'name': 'White Horse Cavendish', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hakuba', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Hakuba Rampage', 'type': 'taijutsu', 'power': 83, 'acc': 85, 'pp': 7, 'effect': None}}
    },
    'op89': {
        'stages': [
            {'name': 'Self-Proclaimed Son', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Whitebeard Jr. Weevil', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Rampage Weevil', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Quake Slash Rampage', 'type': 'special', 'power': 89, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Unstoppable Fury', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op90': {
        'stages': [
            {'name': 'CP9 Kaku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Giraffe Kaku', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Giraffe Sword Mastery', 'type': 'sword', 'power': 81, 'acc': 86, 'pp': 8, 'effect': None}}
    },
    'op91': {
        'stages': [
            {'name': 'CP9 Jabra', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Wolf Jabra', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Wolf Beast Attack', 'type': 'taijutsu', 'power': 80, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op92': {
        'stages': [
            {'name': 'Arlong the Saw', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Shark Arlong', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Shark Teeth Fury', 'type': 'taijutsu', 'power': 78, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'op93': {
        'stages': [
            {'name': 'Mr. 2 Bon Clay', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Newkama Bon Clay', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Okama Kenpo Mastery', 'type': 'taijutsu', 'power': 76, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'op94': {
        'stages': [
            {'name': 'Commander Vergo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Full-Body Haki Vergo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Haki Armor Mastery', 'type': 'haki', 'power': 79, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'op95': {
        'stages': [
            {'name': 'Hero Diamante', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Flutter-Flutter Diamante', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Flutter Blade Mastery', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op96': {
        'stages': [
            {'name': 'Executive Pica', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Stone Giant Pica', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Stone Colossus Crush', 'type': 'special', 'power': 82, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'op97': {
        'stages': [
            {'name': 'Jaguar Pedro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Electro Pedro', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Electro Jaguar Pounce', 'type': 'special', 'power': 81, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'op98': {
        'stages': [
            {'name': 'Young Momonosuke', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Dragon Momonosuke', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Dragon Ascension', 'type': 'special', 'power': 75, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'op99': {
        'stages': [
            {'name': 'Red Hair Roux', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Quick Draw Roux', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Berserker Roux', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Gun Mastery', 'type': 'special', 'power': 88, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Berserker Rampage', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'op100': {
        'stages': [
            {'name': 'Red Hair Yasopp', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Eagle Eye Yasopp', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Observation Master Yasopp', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Eagle Eye Precision', 'type': 'special', 'power': 87, 'acc': 88, 'pp': 7, 'effect': None}, 3: {'name': 'Observation Mastery', 'type': 'special', 'power': 116, 'acc': 81, 'pp': 5, 'effect': None}}
    },
    'op101': {
        'stages': [
            {'name': 'Young Rocks', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'God Valley Rocks', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Rocks the Conqueror', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'God Valley Dominance', 'type': 'special', 'power': 99, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Conqueror Supremacy', 'type': 'special', 'power': 133, 'acc': 74, 'pp': 3, 'effect': None}}
    },
    'op102': {
        'stages': [
            {'name': 'Hyena Bellamy', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Spring Bellamy', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Spring Bomb Bounce', 'type': 'special', 'power': 74, 'acc': 80, 'pp': 8, 'effect': None}}
    },

    # NARUTO CHARACTERS (nr1-nr100)
    'nr1': {
        'stages': [
            {'name': 'Genin Naruto', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sage Mode Naruto', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Baryon Mode Naruto', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Sage Truth Seeker', 'type': 'ninjutsu', 'power': 99, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Baryon Devastation', 'type': 'special', 'power': 134, 'acc': 75, 'pp': 3, 'effect': None}}
    },
    'nr2': {
        'stages': [
            {'name': 'Genin Sasuke', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mangekyo Sasuke', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Rinne Sasuke', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Amaterasu Inferno', 'type': 'ninjutsu', 'power': 98, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Rinnegan Annihilation', 'type': 'special', 'power': 132, 'acc': 76, 'pp': 3, 'effect': None}}
    },
    'nr3': {
        'stages': [
            {'name': 'Genin Sakura', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Byakugou Sakura', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Byakugou Healing Punch', 'type': 'taijutsu', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'nr4': {
        'stages': [
            {'name': 'Copy Ninja Kakashi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mangekyo Kakashi', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'DMS Kakashi', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Kamui Dimension', 'type': 'special', 'power': 91, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Dual Mangekyou Mastery', 'type': 'special', 'power': 120, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr5': {
        'stages': [
            {'name': 'Anbu Itachi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mangekyo Itachi', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Susanoo Itachi', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Tsukuyomi Torture', 'type': 'genjutsu', 'power': 94, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Susanoo Perfect Form', 'type': 'special', 'power': 128, 'acc': 78, 'pp': 4, 'effect': None}}
    },
    'nr6': {
        'stages': [
            {'name': 'Young Madara', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Edo Madara', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Six Paths Madara', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Edo Resurrection Power', 'type': 'special', 'power': 99, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Six Paths Supremacy', 'type': 'special', 'power': 133, 'acc': 74, 'pp': 3, 'effect': None}}
    },
    'nr7': {
        'stages': [
            {'name': 'Young Hashirama', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Wood Style Hashirama', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Sage Mode Hashirama', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Wood Dragon Technique', 'type': 'ninjutsu', 'power': 98, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'True Sage Form', 'type': 'special', 'power': 131, 'acc': 75, 'pp': 3, 'effect': None}}
    },
    'nr8': {
        'stages': [
            {'name': 'Young Obito', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Masked Man Tobi', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Ten Tails Obito', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Masked Kamui Domain', 'type': 'special', 'power': 96, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Ten Tails Awakening', 'type': 'special', 'power': 129, 'acc': 76, 'pp': 4, 'effect': None}}
    },
    'nr9': {
        'stages': [
            {'name': 'Yahiko Pain', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Six Paths Pain', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Chibaku Tensei Pain', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Six Paths Mastery', 'type': 'special', 'power': 93, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Planetary Destruction', 'type': 'special', 'power': 126, 'acc': 78, 'pp': 4, 'effect': None}}
    },
    'nr10': {
        'stages': [
            {'name': 'Young Jiraiya', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Toad Sage Jiraiya', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Sage Mode Jiraiya', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Toad Swamp Technique', 'type': 'ninjutsu', 'power': 90, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Sage Art Mastery', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr11': {
        'stages': [
            {'name': 'Young Tsunade', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Slug Princess Tsunade', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Creation Rebirth Tsunade', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Slug Healing Arts', 'type': 'ninjutsu', 'power': 88, 'acc': 86, 'pp': 8, 'effect': None}, 3: {'name': 'Creation Rebirth Perfection', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr12': {
        'stages': [
            {'name': 'Young Orochimaru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Snake Sage Orochimaru', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'White Snake Orochimaru', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Snake Sage Arts', 'type': 'ninjutsu', 'power': 92, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'White Snake Form', 'type': 'special', 'power': 120, 'acc': 79, 'pp': 5, 'effect': None}}
    },
    'nr13': {
        'stages': [
            {'name': 'Young Minato', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Yellow Flash Minato', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'KCM Minato', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Flying Raijin Mastery', 'type': 'ninjutsu', 'power': 95, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Kurama Mode Supremacy', 'type': 'special', 'power': 127, 'acc': 79, 'pp': 4, 'effect': None}}
    },
    'nr14': {
        'stages': [
            {'name': 'Jonin Guy', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Seven Gates Guy', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Eight Gates Guy', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Seventh Gate Explosion', 'type': 'taijutsu', 'power': 97, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Eighth Gate Apocalypse', 'type': 'special', 'power': 130, 'acc': 75, 'pp': 3, 'effect': None}}
    },
    'nr15': {
        'stages': [
            {'name': 'Genin Lee', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Fifth Gate Lee', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Gate Opening Mastery', 'type': 'taijutsu', 'power': 82, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr16': {
        'stages': [
            {'name': 'Chunin Exam Gaara', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Kazekage Gaara', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Ultimate Defense Gaara', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Sand Armor Mastery', 'type': 'ninjutsu', 'power': 89, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Desert Burial Coffin', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr17': {
        'stages': [
            {'name': 'Jinchuriki Bee', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Eight Tails Bee', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Full Gyuki Bee', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Tailed Beast Bomb', 'type': 'special', 'power': 91, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Full Gyuki Control', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr18': {
        'stages': [
            {'name': 'Genin Neji', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Jonin Neji', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Byakugan Mastery', 'type': 'ninjutsu', 'power': 80, 'acc': 86, 'pp': 8, 'effect': None}}
    },
    'nr19': {
        'stages': [
            {'name': 'Shy Hinata', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Twin Lion Fist Hinata', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Twin Lion Combination', 'type': 'taijutsu', 'power': 77, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr20': {
        'stages': [
            {'name': 'Lazy Shikamaru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Strategist Shikamaru', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Shadow Strategy Mastery', 'type': 'ninjutsu', 'power': 79, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'nr21': {
        'stages': [
            {'name': 'Spy Kabuto', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Snake Kabuto', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Sage Mode Kabuto', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Snake Transformation', 'type': 'ninjutsu', 'power': 88, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Sage Kabuto Perfection', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr22': {
        'stages': [
            {'name': 'Akatsuki Deidara', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'C4 Karura Deidara', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'C4 Clay Explosion', 'type': 'special', 'power': 84, 'acc': 82, 'pp': 7, 'effect': None}}
    },
    'nr23': {
        'stages': [
            {'name': 'Akatsuki Sasori', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hundred Puppets Sasori', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Puppet Army Control', 'type': 'special', 'power': 81, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr24': {
        'stages': [
            {'name': 'Akatsuki Kisame', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Samehada Fusion Kisame', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Shark Skin Kisame', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Water Prison Mastery', 'type': 'ninjutsu', 'power': 89, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Shark Skin Dominance', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr25': {
        'stages': [
            {'name': 'Akatsuki Hidan', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Jashin Ritual Hidan', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Immortal Curse', 'type': 'special', 'power': 80, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr26': {
        'stages': [
            {'name': 'Akatsuki Kakuzu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Five Hearts Kakuzu', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Five Element Mastery', 'type': 'special', 'power': 82, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr27': {
        'stages': [
            {'name': 'Akatsuki Konan', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Paper Ocean Konan', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Paper Angel Mastery', 'type': 'special', 'power': 79, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr28': {
        'stages': [
            {'name': 'Demon of the Mist', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hidden Mist Zabuza', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Mist Sword Technique', 'type': 'sword', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'nr29': {
        'stages': [
            {'name': 'Ice Mirror Haku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Crystal Ice Haku', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Ice Crystal Mastery', 'type': 'ninjutsu', 'power': 76, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr30': {
        'stages': [
            {'name': 'Young Tobirama', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Lord Second', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Edo Tensei Creator', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Water Shark Mastery', 'type': 'ninjutsu', 'power': 94, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Edo Tensei Perfection', 'type': 'special', 'power': 126, 'acc': 79, 'pp': 4, 'effect': None}}
    },
    'nr31': {
        'stages': [
            {'name': 'Young Hiruzen', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'God of Shinobi', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Reaper Death Seal Hiruzen', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'God-Level Jutsu', 'type': 'ninjutsu', 'power': 91, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Reaper Death Seal', 'type': 'special', 'power': 120, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr32': {
        'stages': [
            {'name': 'Root Leader Danzo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Izanagi Danzo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Izanagi Genjutsu', 'type': 'genjutsu', 'power': 81, 'acc': 82, 'pp': 7, 'effect': None}}
    },
    'nr33': {
        'stages': [
            {'name': 'Sealed Kaguya', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Rinne Sharingan Kaguya', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'All-Killing Ash Kaguya', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Rinne Sharingan Vision', 'type': 'special', 'power': 99, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'All-Killing Ash Bones', 'type': 'special', 'power': 134, 'acc': 74, 'pp': 3, 'effect': None}}
    },
    'nr34': {
        'stages': [
            {'name': 'Genin Temari', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Wind Scythe Temari', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Wind Scythe Mastery', 'type': 'ninjutsu', 'power': 77, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr35': {
        'stages': [
            {'name': 'Genin Ino', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sensory Ino', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Mind Transfer Mastery', 'type': 'ninjutsu', 'power': 76, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr36': {
        'stages': [
            {'name': 'Genin Kiba', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Fang Over Fang Kiba', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Four Legged Beast', 'type': 'taijutsu', 'power': 78, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr37': {
        'stages': [
            {'name': 'Jonin Asuma', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Guardian Ninja Asuma', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Chakra Blade Mastery', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr38': {
        'stages': [
            {'name': 'Anbu Tenzo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Wood Style Yamato', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Wood Prison Technique', 'type': 'ninjutsu', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr39': {
        'stages': [
            {'name': 'Genin Shino', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Insect Swarm Shino', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Parasite Swarm Control', 'type': 'ninjutsu', 'power': 76, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr40': {
        'stages': [
            {'name': 'Genin Choji', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Butterfly Mode Choji', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Butterfly Transformation', 'type': 'special', 'power': 81, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr41': {
        'stages': [
            {'name': 'Young Shisui', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Teleporter Shisui', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Kotoamatsukami Shisui', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Shisui Teleportation', 'type': 'ninjutsu', 'power': 88, 'acc': 87, 'pp': 7, 'effect': None}, 3: {'name': 'Kotoamatsukami Genjutsu', 'type': 'genjutsu', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr42': {
        'stages': [
            {'name': 'Young Ay', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Lightning Armor Ay', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Raikage Ay', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Lightning Speed Mastery', 'type': 'ninjutsu', 'power': 90, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Raikage Supremacy', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr43': {
        'stages': [
            {'name': 'Young Ohnoki', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Tsuchikage Ohnoki', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Particle Style Ohnoki', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Earth Style Mastery', 'type': 'ninjutsu', 'power': 89, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Particle Style Destruction', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr44': {
        'stages': [
            {'name': 'Sound Five Kimimaro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Bone Armored Kimimaro', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Bone Forest Prison', 'type': 'special', 'power': 81, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr45': {
        'stages': [
            {'name': 'Young Hagoromo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sage of Six Paths', 'level': 15, 'boosts': {'atk': 8, 'def': 6, 'spd': 5, 'haki': 5, 'df': 5}},
            {'name': 'Juubi Jinchuriki Hagoromo', 'level': 35, 'boosts': {'atk': 15, 'def': 12, 'spd': 10, 'haki': 10, 'df': 10}}
        ],
        'learnMoves': {2: {'name': 'Six Paths Technique', 'type': 'special', 'power': 99, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Ten Tails Power', 'type': 'special', 'power': 133, 'acc': 74, 'pp': 3, 'effect': None}}
    },
    'nr46': {
        'stages': [
            {'name': 'Young Mei', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mizukage Mei', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Lava Style Mastery', 'type': 'ninjutsu', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr47': {
        'stages': [
            {'name': 'Moon Toneri', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Tenseigan Toneri', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Golden Wheel Toneri', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Tenseigan Power', 'type': 'special', 'power': 92, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Golden Wheel Cutter', 'type': 'special', 'power': 124, 'acc': 79, 'pp': 4, 'effect': None}}
    },
    'nr48': {
        'stages': [
            {'name': 'Young Third Raikage', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Strongest Shield', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Hell Stab Raikage', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Spear of Heaven', 'type': 'ninjutsu', 'power': 95, 'acc': 86, 'pp': 7, 'effect': None}, 3: {'name': 'Hell Stab Mastery', 'type': 'special', 'power': 128, 'acc': 78, 'pp': 4, 'effect': None}}
    },
    'nr49': {
        'stages': [
            {'name': 'Second Tsuchikage', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Invisible Mu', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Fission Mu', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Particle Clones', 'type': 'ninjutsu', 'power': 87, 'acc': 85, 'pp': 8, 'effect': None}, 3: {'name': 'Fission Explosion', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr50': {
        'stages': [
            {'name': 'Second Mizukage', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Giant Clam Gengetsu', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Mirage Gengetsu', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Water Mirage Art', 'type': 'ninjutsu', 'power': 88, 'acc': 84, 'pp': 8, 'effect': None}, 3: {'name': 'Clam Shell Mastery', 'type': 'special', 'power': 116, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr51': {
        'stages': [
            {'name': 'Fourth Mizukage', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Three Tails Yagura', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Full Isobu Yagura', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Tailed Beast Ball', 'type': 'special', 'power': 90, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Isobu Control Perfect', 'type': 'special', 'power': 119, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr52': {
        'stages': [
            {'name': 'Kazekage Rasa', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Gold Dust Rasa', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Gold Dust Shield Wall', 'type': 'special', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr53': {
        'stages': [
            {'name': 'Cloud Yugito', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Two Tails Yugito', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Two Tails Fire Bomb', 'type': 'special', 'power': 80, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr54': {
        'stages': [
            {'name': 'Jinchuriki Roshi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Lava Style Roshi', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Lava Release Technique', 'type': 'ninjutsu', 'power': 81, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr55': {
        'stages': [
            {'name': 'Jinchuriki Han', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Steam Armor Han', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Steam Bomb Technique', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr56': {
        'stages': [
            {'name': 'Jinchuriki Utakata', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Bubble Style Utakata', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Bubble Explosion', 'type': 'special', 'power': 79, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr57': {
        'stages': [
            {'name': 'Jinchuriki Fu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Seven Tails Fu', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Seven Tails Bomb', 'type': 'special', 'power': 80, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr58': {
        'stages': [
            {'name': 'Kaguya\'s Will', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'True Form Zetsu', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Black White Merge', 'type': 'special', 'power': 75, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'nr59': {
        'stages': [
            {'name': 'Clone Zetsu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Spiral Zetsu', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Spiral Bomb Technique', 'type': 'special', 'power': 74, 'acc': 79, 'pp': 8, 'effect': None}}
    },
    'nr60': {
        'stages': [
            {'name': 'Young Hanzo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hanzo the Salamander', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Demigod Hanzo', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Salamander Venom', 'type': 'special', 'power': 88, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Demigod Supremacy', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr61': {
        'stages': [
            {'name': 'Sound Four Tayuya', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Curse Mark Tayuya', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Flute Demon Art', 'type': 'special', 'power': 76, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr62': {
        'stages': [
            {'name': 'Sound Four Kidomaru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Curse Mark Kidomaru', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Spider Web Prison', 'type': 'special', 'power': 77, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr63': {
        'stages': [
            {'name': 'Sound Four Sakon', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Merged Form Sakon', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Twin Body Fusion', 'type': 'special', 'power': 78, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr64': {
        'stages': [
            {'name': 'Sound Four Jirobo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Curse Mark Jirobo', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Earth Style Mastery', 'type': 'ninjutsu', 'power': 76, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr65': {
        'stages': [
            {'name': 'Genin Kankuro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Puppet Master Kankuro', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Puppet Army Control', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr66': {
        'stages': [
            {'name': 'Elder Chiyo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Ten Puppets Chiyo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Ten Puppet Mastery', 'type': 'special', 'power': 82, 'acc': 85, 'pp': 7, 'effect': None}}
    },
    'nr67': {
        'stages': [
            {'name': 'Taka Suigetsu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Demon of the Mist Suigetsu', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Water Form Mastery', 'type': 'ninjutsu', 'power': 79, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr68': {
        'stages': [
            {'name': 'Taka Jugo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sage Transformation Jugo', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sage Power Release', 'type': 'special', 'power': 81, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr69': {
        'stages': [
            {'name': 'Taka Karin', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Uzumaki Chains Karin', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Chakra Chains Control', 'type': 'special', 'power': 76, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr70': {
        'stages': [
            {'name': 'Cloud Jonin Darui', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Storm Release Darui', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Fifth Raikage Darui', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Storm Release Mastery', 'type': 'ninjutsu', 'power': 89, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Raikage Authority', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr71': {
        'stages': [
            {'name': 'Cloud Genin Omoi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Lightning Blade Omoi', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Lightning Sword Mastery', 'type': 'ninjutsu', 'power': 77, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr72': {
        'stages': [
            {'name': 'Young Chojuro', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sixth Mizukage Chojuro', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sword Shark Technique', 'type': 'sword', 'power': 80, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'nr73': {
        'stages': [
            {'name': 'Root Anbu Sai', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Super Beast Scroll Sai', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Beast Scroll Art', 'type': 'special', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr74': {
        'stages': [
            {'name': 'Academy Konohamaru', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Rasengan Konohamaru', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Rasengan Mastery', 'type': 'ninjutsu', 'power': 76, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr75': {
        'stages': [
            {'name': 'Jonin Kurenai', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Genjutsu Master Kurenai', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Genjutsu Mastery', 'type': 'genjutsu', 'power': 75, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr76': {
        'stages': [
            {'name': 'Special Jonin Anko', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Snake Summoner Anko', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Snake Summoning Technique', 'type': 'ninjutsu', 'power': 77, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr77': {
        'stages': [
            {'name': 'Academy Iruka', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sensei Iruka', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Teacher\'s Wisdom', 'type': 'special', 'power': 74, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'nr78': {
        'stages': [
            {'name': 'Genin Duy', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Eight Gates Duy', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Gate Power Legacy', 'type': 'taijutsu', 'power': 80, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr79': {
        'stages': [
            {'name': 'Clan Head Hiashi', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Byakugan Master Hiashi', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Byakugan Gentle Fist', 'type': 'taijutsu', 'power': 81, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'nr80': {
        'stages': [
            {'name': 'Jonin Commander Shikaku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Chief Strategist Shikaku', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Shadow Tactics Mastery', 'type': 'ninjutsu', 'power': 80, 'acc': 85, 'pp': 8, 'effect': None}}
    },
    'nr81': {
        'stages': [
            {'name': 'Hot-Blooded Kushina', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Red Hot Habanero', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Chakra Chain Mastery', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr82': {
        'stages': [
            {'name': 'Genin Tenten', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Weapons Mistress Tenten', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Weapon Arsenal Mastery', 'type': 'special', 'power': 77, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr83': {
        'stages': [
            {'name': 'Samurai General Mifune', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Iai Slash Mifune', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Iai Slash Mastery', 'type': 'sword', 'power': 81, 'acc': 86, 'pp': 8, 'effect': None}}
    },
    'nr84': {
        'stages': [
            {'name': 'Scorch Style Pakura', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Hero of Suna Pakura', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Scorch Release Mastery', 'type': 'ninjutsu', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr85': {
        'stages': [
            {'name': 'Gold Brother Ginkaku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sage Tools Ginkaku', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sage Tool Mastery', 'type': 'special', 'power': 80, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr86': {
        'stages': [
            {'name': 'Silver Brother Kinkaku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Sage Tools Kinkaku', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Six Tails Kinkaku', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Sage Tool Control', 'type': 'special', 'power': 88, 'acc': 84, 'pp': 7, 'effect': None}, 3: {'name': 'Six Tails Power', 'type': 'special', 'power': 117, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr87': {
        'stages': [
            {'name': 'Seven Swordsman Mangetsu', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'All Blades Mangetsu', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Seven Sword Mastery', 'type': 'sword', 'power': 82, 'acc': 86, 'pp': 8, 'effect': None}}
    },
    'nr88': {
        'stages': [
            {'name': 'Root Torune', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Nano Insects Torune', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Nano Insect Swarm', 'type': 'ninjutsu', 'power': 75, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'nr89': {
        'stages': [
            {'name': 'Hunter Ao', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Byakugan Ao', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Byakugan Vision', 'type': 'ninjutsu', 'power': 76, 'acc': 82, 'pp': 8, 'effect': None}}
    },
    'nr90': {
        'stages': [
            {'name': 'Monk Chiriku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Welcoming Approach Chiriku', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Monk Prayer Technique', 'type': 'special', 'power': 78, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr91': {
        'stages': [
            {'name': 'Rain Genin Ajisai', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Paper Bomb Ajisai', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Paper Bomb Mastery', 'type': 'special', 'power': 75, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr92': {
        'stages': [
            {'name': 'Proctor Hayate', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Crescent Moon Hayate', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Crescent Moon Blade', 'type': 'sword', 'power': 76, 'acc': 83, 'pp': 8, 'effect': None}}
    },
    'nr93': {
        'stages': [
            {'name': 'Interrogator Ibiki', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mental Warfare Ibiki', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Mind Break Technique', 'type': 'genjutsu', 'power': 76, 'acc': 80, 'pp': 8, 'effect': None}}
    },
    'nr94': {
        'stages': [
            {'name': 'Police Chief Fugaku', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Wicked Eye Fugaku', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sharingan Eye Power', 'type': 'special', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr95': {
        'stages': [
            {'name': 'Young Izuna', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Mangekyo Izuna', 'level': 15, 'boosts': {'atk': 6, 'def': 4, 'spd': 3, 'haki': 3, 'df': 3}},
            {'name': 'Legendary Izuna', 'level': 30, 'boosts': {'atk': 10, 'def': 8, 'spd': 6, 'haki': 6, 'df': 6}}
        ],
        'learnMoves': {2: {'name': 'Izuna Susanoo', 'type': 'special', 'power': 89, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Legendary Power', 'type': 'special', 'power': 118, 'acc': 80, 'pp': 5, 'effect': None}}
    },
    'nr96': {
        'stages': [
            {'name': 'Young Kagami', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Loyal Sharingan Kagami', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Sharingan Copy Mastery', 'type': 'special', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr97': {
        'stages': [
            {'name': 'Young Sakumo', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'White Fang', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Legend of the White Fang', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'White Fang Mastery', 'type': 'sword', 'power': 95, 'acc': 88, 'pp': 7, 'effect': None}, 3: {'name': 'Legendary Sword Art', 'type': 'special', 'power': 126, 'acc': 81, 'pp': 4, 'effect': None}}
    },
    'nr98': {
        'stages': [
            {'name': 'Genin Nawaki', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Will of Fire Nawaki', 'level': 20, 'boosts': {'atk': 4, 'def': 3, 'spd': 2, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Fire Spirit Technique', 'type': 'ninjutsu', 'power': 75, 'acc': 81, 'pp': 8, 'effect': None}}
    },
    'nr99': {
        'stages': [
            {'name': 'Jonin Dan', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Spirit Dan Kato', 'level': 20, 'boosts': {'atk': 5, 'def': 4, 'spd': 3, 'haki': 2, 'df': 2}}
        ],
        'learnMoves': {2: {'name': 'Spirit Fire Technique', 'type': 'ninjutsu', 'power': 79, 'acc': 84, 'pp': 8, 'effect': None}}
    },
    'nr100': {
        'stages': [
            {'name': 'Crippled Nagato', 'level': 1, 'boosts': {'atk': 0, 'def': 0, 'spd': 0, 'haki': 0, 'df': 0}},
            {'name': 'Rinnegan Nagato', 'level': 15, 'boosts': {'atk': 7, 'def': 5, 'spd': 4, 'haki': 4, 'df': 4}},
            {'name': 'Edo Nagato Restored', 'level': 35, 'boosts': {'atk': 12, 'def': 10, 'spd': 8, 'haki': 8, 'df': 8}}
        ],
        'learnMoves': {2: {'name': 'Rinnegan Six Paths', 'type': 'special', 'power': 96, 'acc': 85, 'pp': 7, 'effect': None}, 3: {'name': 'Edo Rinnegan Mastery', 'type': 'special', 'power': 128, 'acc': 78, 'pp': 4, 'effect': None}}
    }
}

def generate_evolution_javascript():
    """Generate the JavaScript evolution engine code"""
    js_code = """
// MULTI-STAGE POKEMON-STYLE EVOLUTION SYSTEM
// Generated by patch_evo_v2.py

const CHAR_EVOLUTIONS = """
    
    js_code += generate_char_evolutions_object()
    js_code += """;

// Get current evolution stage (1, 2, or 3)
function getEvoStage(id) {
  const saved = evoData[id];
  if(!saved) return 1;
  return saved;
}

// Get evolution stage data
function getEvoStageData(id) {
  const evo = CHAR_EVOLUTIONS[id];
  if(!evo) return null;
  const stage = getEvoStage(id);
  return evo.stages[stage - 1] || evo.stages[0];
}

// Get next evolution info (or null if maxed)
function getNextEvo(id) {
  const evo = CHAR_EVOLUTIONS[id];
  if(!evo) return null;
  const stage = getEvoStage(id);
  if(stage >= evo.stages.length) return null;
  return evo.stages[stage]; // next stage data
}

// Can this character evolve to next stage?
function canEvolve(id) {
  const evo = CHAR_EVOLUTIONS[id];
  if(!evo) return false;
  const stage = getEvoStage(id);
  if(stage >= evo.stages.length) return false;
  const next = evo.stages[stage];
  if(getCharLevelNum(id) < next.level) return false;
  return true;
}

// Perform evolution
function evolveCharacter(id) {
  if(!canEvolve(id)) return;
  const evo = CHAR_EVOLUTIONS[id];
  const stage = getEvoStage(id);
  const nextStage = stage + 1;
  evoData[id] = nextStage;
  saveEvolutions(evoData);
  
  // Learn new move if available
  if(evo.learnMoves && evo.learnMoves[nextStage]) {
    const newMove = evo.learnMoves[nextStage];
    learnNewMove(id, newMove);
  }
  
  playSound('win');
  showCharDetail(id);
}

// Learn a new move (replace weakest)
function learnNewMove(id, newMove) {
  const moves = BATTLE_MOVES[id];
  if(!moves) return;
  // Find weakest move (lowest power)
  let weakIdx = 0;
  let weakPow = moves[0].power;
  for(let i=1; i<moves.length; i++) {
    if(moves[i].power < weakPow) { weakPow = moves[i].power; weakIdx = i; }
  }
  // Only replace if new move is stronger
  if(newMove.power > weakPow) {
    moves[weakIdx] = newMove;
  }
}

// Get total evo stat boosts for current stage
function getEvoBoosts(id) {
  const evo = CHAR_EVOLUTIONS[id];
  if(!evo) return {atk:0,def:0,spd:0,haki:0,df:0};
  const stage = getEvoStage(id);
  if(stage <= 1) return {atk:0,def:0,spd:0,haki:0,df:0};
  // Sum all boosts up to current stage
  let total = {atk:0,def:0,spd:0,haki:0,df:0};
  for(let i=1; i<stage; i++) {
    const b = evo.stages[i].boosts;
    total.atk += b.atk||0;
    total.def += b.def||0;
    total.spd += b.spd||0;
    total.haki += b.haki||0;
    total.df += b.df||0;
  }
  return total;
}

// isEvolved now means stage > 1 (for backward compat with passive checks)
function isEvolved(id) { return getEvoStage(id) > 1; }

// Get current evolution form name
function getEvoFormName(id) {
  const data = getEvoStageData(id);
  return data ? data.name : getCharName(id);
}
"""
    return js_code

def generate_char_evolutions_object():
    """Generate the JavaScript object from Python data"""
    import json
    return json.dumps(CHAR_EVOLUTIONS, indent=2)

def patch_battle_js(battle_js_path):
    """Patch battle.js with new evolution system"""
    with open(battle_js_path, 'r') as f:
        content = f.read()
    
    # Remove old EVOLUTION_DATA if present
    content = re.sub(r'const EVOLUTION_DATA = \{[^}]*\};', '', content, flags=re.DOTALL)
    
    # Remove old evolution functions
    funcs_to_remove = ['canEvolve', 'evolveCharacter', 'getEvoBoosts', 'isEvolved', 'getEvoStage', 'getEvoStageData', 'getNextEvo', 'learnNewMove', 'getEvoFormName']
    for func in funcs_to_remove:
        content = re.sub(rf'function {func}\([^)]*\) \{{[^}}]*\}}', '', content, flags=re.DOTALL)
    
    # Add new evolution code near the top
    evolution_code = generate_evolution_javascript()
    if 'const CHAR_DATA = ' in content:
        idx = content.index('const CHAR_DATA = ')
        content = content[:idx] + evolution_code + '\n\n' + content[idx:]
    else:
        content = evolution_code + '\n\n' + content
    
    with open(battle_js_path, 'w') as f:
        f.write(content)
    
    return True

if __name__ == '__main__':
    import sys
    import os
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    battle_js = os.path.join(script_dir, 'battle.js')
    
    if os.path.exists(battle_js):
        print(f"Patching {battle_js}...")
        patch_battle_js(battle_js)
        print("✓ Evolution system patched successfully!")
    else:
        print(f"Error: battle.js not found at {battle_js}")
        sys.exit(1)
